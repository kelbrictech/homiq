-- Fictional provider cash-out simulation. Never transfers real funds.
CREATE TABLE IF NOT EXISTS demo_cashout_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider_user_id uuid NOT NULL REFERENCES users(id),
 amount_cents bigint NOT NULL CHECK(amount_cents>0),
 method text NOT NULL CHECK(method IN ('gcash','maya','bank')),
 destination_label text NOT NULL CHECK(length(destination_label) BETWEEN 2 AND 120),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(),
 decided_at timestamptz,
 decision_note text
);
CREATE INDEX IF NOT EXISTS demo_cashout_provider_idx ON demo_cashout_requests(provider_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS demo_cashout_pending_idx ON demo_cashout_requests(created_at) WHERE status='pending';
ALTER TABLE demo_wallet_ledger DROP CONSTRAINT IF EXISTS demo_wallet_ledger_entry_type_check;
ALTER TABLE demo_wallet_ledger ADD CONSTRAINT demo_wallet_ledger_entry_type_check
 CHECK(entry_type IN ('seed','reserve','release','capture','earning','refund','cashout_reserve','cashout_approve','cashout_release'));
