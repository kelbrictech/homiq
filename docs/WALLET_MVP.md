# Implementation audit — October 9, 2026

The original specification below predates implementation. Current code on main includes fictional wallet schema, owner-scoped balance/ledger endpoints, provider quotation entry, customer approval/rejection, delivery confirmation, atomic settlement, cancellation release, and admin-dispute cancellation release. Lifecycle now requires funded quotation before start. PostgreSQL integration coverage was expanded for approval authorization, insufficient balance, cancellation release and duplicate settlement.

**Not complete:** secure account registration and consent storage; live payments/top-up; refund and post-settlement dispute policies; deployed browser E2E acceptance; production release. This remains development-only.

---

# HOMIQ MVP — internal wallet settlement contract
Status: Product decision recorded; **not implemented**. Internal balances are fictional test credits, not real money.

## Approved product behavior
- Payment is deducted upon confirmation of service delivery, not when the service is booked.
- The customer and provider agree on a PHP quotation before work starts.
- The system reserves the approved quote against the customer's available test-wallet balance.
- A customer confirmation of delivered service triggers a single atomic settlement: capture reserved customer credits, credit provider test earnings, and mark booking payment as settled.
- Provider marking work complete does not itself capture funds.
- Cancellation before settlement releases the hold; a dispute blocks capture pending an explicit resolution.
- No payment gateway, deposits, withdrawals, cash redemption, or actual money movement in MVP.

## Required implementation
1. Add wallets (one per user; PHP cents), immutable wallet ledger, booking-specific holds, and unique settlement idempotency keys.
2. Implement provider quote creation and customer quote approval/rejection with ownership checks and transactional locking.
3. Reject quote approval when available credits are insufficient; never allow negative available balance.
4. Require assigned provider, correct booking state, and approved quote before starting work.
5. Introduce delivery confirmation as a separate customer-only action following provider completion.
6. In one DB transaction lock booking, hold and wallets; capture exactly once, create balanced ledger entries and a booking event; make retries safe.
7. Define admin-mediated dispute and refund rules; never silently transfer held credits.
8. Seed fictional wallet credits and show available, reserved and history clearly marked DEMO.
9. Test concurrent approvals, double confirmation, cancellation races, insufficient funds, account isolation, and dispute holds.

## Acceptance
TF-01/02: customer books -> provider accepts -> quotes -> customer approves (hold) -> provider completes -> customer confirms delivery -> wallet settles exactly once. A declined quote, insufficient wallet, canceled booking, or disputed delivery must never debit the customer.
