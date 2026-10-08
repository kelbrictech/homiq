# HOMIQ — Proper Application Development

## Architecture
- `apps/web`: React + TypeScript + Vite mobile-first customer application
- `src`: Express API and transactional booking engine
- `sql`: PostgreSQL schema and 30+30 fictional demo identity seed
- `docs/architecture/AM-001-mobile-first.md`: mandatory mobile-first policy

The original standalone `public/demo.html` is a **historical prototype only**, not the target product.

## Development setup
Requires Node.js, npm, PostgreSQL and psql.

Terminal A (project root):
```powershell
npm install
Copy-Item .env.example .env
# Edit .env with your local PostgreSQL connection string.
# Create the homiq database in PostgreSQL first.
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/001_init.sql
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/002_seed_demo.sql
npm run dev
```
PowerShell note: `psql` does not automatically read the .env file. Set `$env:DATABASE_URL` to the same connection string before running migrations, or use your PostgreSQL client.

Terminal B:
```powershell
cd apps/web
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://127.0.0.1:5173).

## Current implemented customer workflow
1. Choose one of the six services.
2. Complete category-specific booking intake.
3. Choose a future date and service address.
4. Submit to the actual development API.
5. Review saved bookings from PostgreSQL.
6. Switch among seeded fictional customers.

## Current limitations
- Provider and admin React interfaces are not yet implemented.
- The 30 provider records exist in SQL seed definitions, but are not yet exposed in the React app.
- Booking offers and dispatch are not automatically generated.
- The API uses an insecure development-only identity header. It must never be exposed to the public.
- Backend refuses to start when `NODE_ENV=production` until proper authentication is implemented.
- No payments, live GPS, company team operations or production hosting.
- CI, typechecking, integration tests and live deployment have not been verified in this handoff.

## Next milestone
Implement proper development authentication, provider job inbox, verified-category eligibility, admin approval UI, and end-to-end transactional dispatch testing. Then prepare secure production authentication and deployment.
