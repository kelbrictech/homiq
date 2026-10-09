-- HOMIQ FICTIONAL TEST CREDITS ONLY. NOT LEGAL TENDER OR REAL-MONEY STORED VALUE.
-- Apply after 001_init.sql; seed users via 002_seed_demo.sql first.
CREATE TABLE IF NOT EXISTS demo_wallets (
 user_id uuid PRIMARY KEY REFERENCES users(id),
 balance_cents bigint NOT NULL DEFAULT 0 CHECK(balance_cents>=0),
 reserved_cents bigint NOT NULL DEFAULT 0 CHECK(reserved_cents>=0 AND reserved_cents<=balance_cents),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS demo_wallet_holds (
 booking_id uuid PRIMARY KEY REFERENCES bookings(id),
 customer_id uuid NOT NULL REFERENCES users(id),
 amount_cents bigint NOT NULL CHECK(amount_cents>0),
 status text NOT NULL CHECK(status IN ('reserved','released','captured')),
 created_at timestamptz NOT NULL DEFAULT now(),
 settled_at timestamptz
);
CREATE TABLE IF NOT EXISTS demo_wallet_ledger (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 booking_id uuid REFERENCES bookings(id),
 entry_type text NOT NULL CHECK(entry_type IN ('seed','reserve','release','capture','earning','refund')),
 amount_cents bigint NOT NULL,
 idempotency_key text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Idempotent fixture: 30 customers receive 5,000 fictional pesos; 30 providers start at zero.
INSERT INTO demo_wallets(user_id,balance_cents)
SELECT id,500000 FROM users WHERE email LIKE 'customer%@example.test'
ON CONFLICT(user_id) DO NOTHING;
INSERT INTO demo_wallets(user_id,balance_cents)
SELECT id,0 FROM users WHERE email LIKE 'provider%@example.test'
ON CONFLICT(user_id) DO NOTHING;
INSERT INTO demo_wallet_ledger(user_id,entry_type,amount_cents,idempotency_key)
SELECT id,'seed',500000,'seed:'||id::text FROM users WHERE email LIKE 'customer%@example.test'
ON CONFLICT(idempotency_key) DO NOTHING;
