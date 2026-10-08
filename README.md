# HOMIQ — Home Services Marketplace

Hybrid marketplace MVP for general cleaning, nanny/babysitting, hair services, plumbing, and tutoring.

## Architecture
- Customers book instant or scheduled home services.
- Independent providers and company workers can serve multiple categories.
- Each provider-category combination requires independent verification.
- The booking engine enforces eligibility, assignment exclusivity, and auditable job transitions.

## Implementation
Initial TypeScript/Express + PostgreSQL backend starter is being migrated into this repository. This README is the initial repository bootstrap, **not** a deployed application.

## MVP milestones
1. Database schema and category seed data
2. Booking intake and category validation
3. Provider verification and availability
4. Transactional dispatch and assignment
5. Admin operations and testing
