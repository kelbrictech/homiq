# HOMIQ — Execution roadmap (2026-10-09)

Evidence rule: a committed feature is not accepted until its GitHub Actions tests pass. CI green does not establish production readiness.

| Milestone | State | Acceptance evidence |
| --- | --- | --- |
| V0.6A/B — Booking + dispatch vertical slice | Implemented, limited | GitHub Actions run 37876476470: four tests passed including PostgreSQL dispatch/acceptance |
| V0.6C — Booking lifecycle | In progress | Transactional cancel/start/complete/dispute implemented; PostgreSQL lifecycle tests added, latest run must be checked |
| V0.6C — Offer expiry and redispatch | Partial | Read-triggered expiry reconciliation exists; scheduled sweeper and multi-wave redispatch missing |
| V0.6D — Provider workspace and admin console | Partial / not started | Provider offer UI partial; admin approval/oversight missing |
| V0.6E — Customer journey and mobile UX | Partial | Customer booking UI partial; full history, ratings, responsive visual acceptance missing |
| V0.7 — Secure identity and roles | Blocked for public release | Development identity header only; production startup intentionally disabled |
| V0.8 — Payments, notifications, launch hardening | Not started | Payment integration, end-to-end tests, observability, staging verification missing |

## Immediate engineering gate
1. Verify CI for lifecycle integration tests on PostgreSQL.
2. Implement expiry worker and redispatch safely; test concurrent acceptance, decline, cancellation and expiry.
3. Wire customer/provider UI to lifecycle endpoints.
4. Implement real authentication and authorization before any public deployment.

No release or MVP-complete claim until verified.
