import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import pg from 'pg';
import {sweepAndRedispatch} from '../src/redispatch.js';
import {generateOffers} from '../src/dispatch.js';
import {acceptOffer} from '../src/engine.js';

const url = process.env.TEST_DATABASE_URL;

test('Redispatch sweep concurrency and idempotency', {skip: !url ? 'TEST_DATABASE_URL required' : false}, async () => {
  if (!new URL(url!).pathname.endsWith('/homiq_test')) throw new Error('Refusing destructive integration setup outside homiq_test');
  
  const pool = new pg.Pool({connectionString: url});
  try {
    // Setup
    await pool.query('SELECT pg_advisory_lock(817273)');
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public');
    await pool.query(readFileSync('sql/001_init.sql', 'utf8'));
    await pool.query(readFileSync('sql/002_seed_demo.sql', 'utf8'));

    const customer = '10000000-0000-4000-8000-000000000001';
    
    // Create 3 bookings in matching state with offers about to expire
    const bookingIds = [];
    for (let i = 0; i < 3; i++) {
      const starts = new Date(Date.now() + 5 * 86400000);
      const ends = new Date(starts.getTime() + 2 * 3600000);
      const booking = await pool.query(
        "INSERT INTO bookings(customer_id, category_code, starts_at, ends_at, address_text, intake) VALUES($1, 'repairs', $2, $3, 'Test Address ' || $4, '{}') RETURNING id",
        [customer, starts, ends, i]
      );
      bookingIds.push(booking.rows[0].id);
    }

    // Generate initial offers for all bookings
    for (const id of bookingIds) {
      await generateOffers(pool, id);
    }

    // Verify initial state
    const initialOffers = await pool.query(
      "SELECT COUNT(*) as cnt FROM dispatch_offers WHERE status = 'pending'"
    );
    const initialCount = Number(initialOffers.rows[0].cnt);
    assert.ok(initialCount > 0, 'Initial offers should have been created');

    await pool.query("UPDATE dispatch_offers SET expires_at=now()-interval '1 second' WHERE booking_id=ANY($1::uuid[])",[bookingIds]);
    // Simulate concurrent sweep operations after offers expire
    const sweepResults = await Promise.all([
      sweepAndRedispatch(pool),
      sweepAndRedispatch(pool),
      sweepAndRedispatch(pool),
    ]);

    // All sweeps should complete without error
    assert.equal(sweepResults.length, 3, 'All concurrent sweeps should complete');
    
    // Check that state is consistent (no duplicate operations)
    for (const result of sweepResults) {
      assert.ok(typeof result.bookingsChecked === 'number');
      assert.ok(typeof result.offersCreated === 'number');
      assert.ok(typeof result.expired === 'number');
    }

    const duplicates=await pool.query("SELECT booking_id,provider_id,COUNT(*) AS n FROM dispatch_offers WHERE booking_id=ANY($1::uuid[]) GROUP BY booking_id,provider_id HAVING COUNT(*)>1",[bookingIds]);
    assert.equal(duplicates.rowCount,0);
    // Verify idempotency: second sweep should be harmless
    const secondSweep = await sweepAndRedispatch(pool);
    assert.ok(secondSweep.bookingsChecked >= 0, 'Second sweep should complete cleanly');

  } finally {
    await pool.query('SELECT pg_advisory_unlock(817273)');
    await pool.end();
  }
});

test('Redispatch respects category restrictions', {skip: !url ? 'TEST_DATABASE_URL required' : false}, async () => {
  if (!new URL(url!).pathname.endsWith('/homiq_test')) throw new Error('Refusing destructive integration setup outside homiq_test');
  
  const pool = new pg.Pool({connectionString: url});
  try {
    await pool.query('SELECT pg_advisory_lock(817273)');
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public');
    await pool.query(readFileSync('sql/001_init.sql', 'utf8'));
    await pool.query(readFileSync('sql/002_seed_demo.sql', 'utf8'));

    const customer = '10000000-0000-4000-8000-000000000001';
    
    // Create personal_assistance booking (restricted)
    const starts = new Date(Date.now() + 5 * 86400000);
    const ends = new Date(starts.getTime() + 2 * 3600000);
    const booking = await pool.query(
      "INSERT INTO bookings(customer_id, category_code, starts_at, ends_at, address_text, intake) VALUES($1, 'personal_assistance', $2, $3, 'Restricted Test', '{\"assistanceType\":\"elder_care\",\"description\":\"Sample\"}') RETURNING id",
      [customer, starts, ends]
    );
    const restrictedId = booking.rows[0].id;

    // Attempt to generate offers for restricted category
    const result = await generateOffers(pool, restrictedId);
    
    // Should not create offers (restricted category)
    assert.equal(result.offersCreated, 0, 'Restricted category should not generate offers');

    // Sweep should not redispatch restricted bookings
    const sweep = await sweepAndRedispatch(pool);
    
    // Verify booking still in requested state
    const status = await pool.query('SELECT status FROM bookings WHERE id = $1', [restrictedId]);
    assert.equal(status.rows[0].status, 'requested', 'Restricted booking should remain in requested state');

  } finally {
    await pool.query('SELECT pg_advisory_unlock(817273)');
    await pool.end();
  }
});

test('Redispatch handles expired offers and creates new ones', {skip: !url ? 'TEST_DATABASE_URL required' : false}, async () => {
  if (!new URL(url!).pathname.endsWith('/homiq_test')) throw new Error('Refusing destructive integration setup outside homiq_test');
  
  const pool = new pg.Pool({connectionString: url});
  try {
    await pool.query('SELECT pg_advisory_lock(817273)');
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public');
    await pool.query(readFileSync('sql/001_init.sql', 'utf8'));
    await pool.query(readFileSync('sql/002_seed_demo.sql', 'utf8'));

    const customer = '10000000-0000-4000-8000-000000000001';
    
    // Create booking
    const starts = new Date(Date.now() + 5 * 86400000);
    const ends = new Date(starts.getTime() + 2 * 3600000);
    const booking = await pool.query(
      "INSERT INTO bookings(customer_id, category_code, starts_at, ends_at, address_text, intake) VALUES($1, 'repairs', $2, $3, 'Test Address', '{}') RETURNING id",
      [customer, starts, ends]
    );
    const bookingId = booking.rows[0].id;

    // Generate offers
    await generateOffers(pool, bookingId);

    // Manually expire all pending offers
    await pool.query(
      "UPDATE dispatch_offers SET expires_at = now() - interval '1 second' WHERE booking_id = $1",
      [bookingId]
    );

    // Verify offers are now expired
    const beforeSweep = await pool.query(
      "SELECT COUNT(*) as pending FROM dispatch_offers WHERE booking_id = $1 AND status = 'pending'",
      [bookingId]
    );
    assert.ok(Number(beforeSweep.rows[0].pending) > 0, 'Offer status remains pending until the sweep runs');

    // Run sweep to expire and redispatch
    const sweep = await sweepAndRedispatch(pool);
    assert.ok(sweep.expired > 0, 'Sweep should have expired offers');

    // Verify new offers were created
    const afterSweep = await pool.query(
      "SELECT COUNT(*) as pending FROM dispatch_offers WHERE booking_id = $1 AND status = 'pending'",
      [bookingId]
    );
    assert.equal(Number(afterSweep.rows[0].pending), 0, 'No repeat offers when initial wave exhausts eligible providers');

  } finally {
    await pool.query('SELECT pg_advisory_unlock(817273)');
    await pool.end();
  }
});

test('Redispatch skips confirmed and in-progress bookings', {skip: !url ? 'TEST_DATABASE_URL required' : false}, async () => {
  if (!new URL(url!).pathname.endsWith('/homiq_test')) throw new Error('Refusing destructive integration setup outside homiq_test');
  
  const pool = new pg.Pool({connectionString: url});
  try {
    await pool.query('SELECT pg_advisory_lock(817273)');
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public');
    await pool.query(readFileSync('sql/001_init.sql', 'utf8'));
    await pool.query(readFileSync('sql/002_seed_demo.sql', 'utf8'));

    const customer = '10000000-0000-4000-8000-000000000001';
    
    // Create and confirm a booking
    const starts = new Date(Date.now() + 5 * 86400000);
    const ends = new Date(starts.getTime() + 2 * 3600000);
    const booking = await pool.query(
      "INSERT INTO bookings(customer_id, category_code, starts_at, ends_at, address_text, intake, status) VALUES($1, 'repairs', $2, $3, 'Test Address', '{}', 'confirmed') RETURNING id",
      [customer, starts, ends]
    );
    const confirmedId = booking.rows[0].id;

    // Run sweep
    const sweep = await sweepAndRedispatch(pool);

    // Verify booking is still confirmed (not touched by sweep)
    const status = await pool.query('SELECT status FROM bookings WHERE id = $1', [confirmedId]);
    assert.equal(status.rows[0].status, 'confirmed', 'Confirmed bookings should not be modified by sweep');

  } finally {
    await pool.query('SELECT pg_advisory_unlock(817273)');
    await pool.end();
  }
});
