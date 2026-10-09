# HOMIQ — engineering handoff (2026-10-09)

## Verified scope
Local development application includes customer booking and history, dispatch and redispatch, provider offer decisions and job lifecycle, and a development admin console for qualification decisions and dispute resolution. The API intentionally blocks production startup.

## Run locally
1. Install Node.js 22 and PostgreSQL 16.
2. Copy `.env.example` to `.env`, configure `DATABASE_URL`, set `ALLOW_INSECURE_DEV_AUTH=true`, `ENABLE_DEMO_ROUTES=true`, and a unique `DEV_ADMIN_KEY`.
3. Apply `sql/001_init.sql` to your development database and review repository README for fixtures/seed setup.
4. At repository root run `npm install` then `npm run dev`.
5. In `apps/web`, run `npm install` and `npm run dev`. Use the Customer, Provider, and Admin (dev) tabs.
6. Run `npm run typecheck && npm test` at root and `npm run build` in `apps/web`. GitHub Actions runs these checks with PostgreSQL.

## Unfinished — do not release publicly
- Production identity, session security, roles and authorization.
- Real payments and refunds, financial reconciliation.
- Provider/customer notifications and communication.
- Browser-based end-to-end testing with seeded fixtures, responsive/accessibility QA.
- Staging deployment, monitoring, backups, incident handling and launch validation.
- Provider earnings, customer ratings, and dispute evidence workflows.

## Security limitations
Development identity is supplied through a request header; it is not authentication. The admin key is entered in the browser for local testing only, not a production authorization scheme. Production startup is blocked by design. Pending provider offers redact booking intake until acceptance.

## Proof
CI: https://github.com/kelbrictech/homiq/actions
Repository: https://github.com/kelbrictech/homiq
Always verify the latest commit's CI conclusion; an earlier green run does not certify later changes.
