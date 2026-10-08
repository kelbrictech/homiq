# HOMIQ — Hybrid Home Services Marketplace

## MVP service categories
1. Repairs
2. Cleaning
3. Maintenance
4. Outdoor
5. Moving & Delivery
6. Personal Assistance

## Demo dataset
`sql/002_seed_demo.sql` creates **30 fictional customers and 30 fictional providers**, with category-specific qualifications and availability. Run only against a disposable development database after `sql/001_init.sql`. These records are NOT authenticated login accounts; authentication is not implemented yet.

## Local setup (development only)
1. `npm install`
2. Create PostgreSQL database `homiq` and set `DATABASE_URL` in `.env` based on `.env.example`.
3. Run `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/001_init.sql`
4. Run `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/002_seed_demo.sql`
5. `npm test` and `npm run typecheck`
6. `npm run dev`

**Security:** API uses `x-dev-user-id` as an untrusted development placeholder. Do not deploy publicly. Production authentication, authorization, verification evidence, booking histories, payments, and frontend remain outstanding.
