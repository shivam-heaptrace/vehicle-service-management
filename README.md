# Vehicle Service Management System

> A full-stack web app for managing vehicle service appointments, repair tracking, and billing — replacing paper-based records at the automobile service center.

## What this app does

Service center staff can book customer appointments, track repair progress, manage mechanic workloads, and handle billing — all from one place. Customers, vehicles, mechanics, appointments, repair records, and invoices are all stored in a PostgreSQL database. Seed data is pre-loaded on first deploy.

## Who uses it

- **Service Advisors (6)** — manage customer bookings and appointments
- **Mechanics (20)** — update repair status and log work performed
- **Billing staff** — manage invoices and record payments
- **Customers (~1,000/year)** — browse service history (advisor-assisted)

## Local development

```sh
npm install
npm run dev
```

Open http://localhost:8080

## Build and run with Docker

```sh
docker build -t vehicle-service-management .
docker run -p 8080:8080 vehicle-service-management
```

## Database

- Engine: PostgreSQL via Cloud SQL (shared instance)
- Connection: Unix socket via `CLOUDSQL_CONNECTION_NAME` — never TCP
- DB name: `vehicle_service_management_db` (underscores — required by platform)
- Password: stored in GCP Secret Manager as `vehicle-service-management-db-password`
- Migrations run automatically from `db/migrations/` on every deploy

## Review documents

- [context.md](./context.md) — Purpose, data sources, credentials, risk assessment
- [testing-report.md](./testing-report.md) — Test results and known limitations
