import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import pg from 'pg';
import {generateOffers} from '../src/dispatch.js';
import {acceptOffer} from '../src/engine.js';
const url=process.env.TEST_DATABASE_URL;
test('Postgres booking, dispatch, acceptance and conflict', {skip:!url?'TEST_DATABASE_URL required':false}, async()=>{
 if(!new URL(url!).pathname.endsWith('/homiq_test')) throw new Error('Refusing destructive integration setup outside homiq_test');
 const pool=new pg.Pool({connectionString:url});
 try {
  await pool.query('BEGIN'); await pool.query('ROLLBACK');
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public');
  await pool.query(readFileSync('sql/001_init.sql','utf8'));
  await pool.query(readFileSync('sql/002_seed_demo.sql','utf8'));
  const customer='10000000-0000-4000-8000-000000000001';
  const starts=new Date(Date.now()+3*86400000), ends=new Date(starts.getTime()+2*3600000);
  const booking=await pool.query("INSERT INTO bookings(customer_id,category_code,starts_at,ends_at,address_text,intake) VALUES($1,'repairs',$2,$3,'Calamba City', $4) RETURNING id",[customer,starts,ends,JSON.stringify({problemType:'leak',description:'Sink leak'})]);
  const id=booking.rows[0].id;
  const offers=await generateOffers(pool,id);assert.ok(offers.offersCreated>0);
  const rows=await pool.query('SELECT o.id,p.user_id FROM dispatch_offers o JOIN providers p ON p.id=o.provider_id WHERE booking_id=$1',[id]);
  const attempts=await Promise.allSettled(rows.rows.slice(0,2).map(o=>acceptOffer(pool,o.id,o.user_id)));
  assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
  const assignment=await pool.query('SELECT * FROM assignments WHERE booking_id=$1',[id]);assert.equal(assignment.rowCount,1);
  const status=await pool.query('SELECT status FROM bookings WHERE id=$1',[id]);assert.equal(status.rows[0].status,'confirmed');
 } finally {await pool.end();}
});
