# context.md — Vehicle Service Management System

> **Review document for COE human approval.** This file describes the app's purpose,
> architecture, data access, and risk profile. It must be complete before submission.

---

## 1. Purpose and Users

**What this app does:**
This app replaces paper-based service records at an automobile service center by providing a centralised web system for booking customer appointments, tracking vehicle repairs, managing mechanic workloads, and handling billing and invoicing. Service advisors can schedule appointments, mechanics can update repair status and log work performed, and billing staff can issue invoices and record payments — all from a single interface.

**Primary users:**
- Service Advisors (6) — manage appointment bookings and customer records
- Mechanics (20) — update repair progress and log parts and labor
- Billing Staff — generate invoices and record payments
- Approximately 1,000 customers per year (managed by advisors on their behalf)

**Usage frequency:**
Daily — service advisors and mechanics use the system throughout every working day.

**Estimated time saved:**
Manual time per run: 60 minutes. Frequency: 29,280 runs/week (488 hours/week × 60).
That's approximately 29,280 hours per week saved for the team.

---

## 2. Backend Summary

**Framework:** Node.js + Express + TypeScript (Fulcrum standard full-webapp blueprint)
**Hosting:** GCP Cloud Run — single container serving frontend + API
**Runtime port:** 8080

**API routes:**
| Route | Method | Purpose | Auth Required |
|---|---|---|---|
| /api/health | GET | Health check — required by Cloud Run | No (public infrastructure check) |
| /api/me | GET | Returns logged-in user email from IAP header | Yes |
| /api/dashboard | GET | Summary stats: today's appointments, billing totals | Yes |
| /api/customers | GET | List all customers with vehicle count | Yes |
| /api/customers/:id | GET | Get a single customer by ID | Yes |
| /api/customers | POST | Create a new customer | Yes |
| /api/customers/:id | PUT | Update customer details | Yes |
| /api/customers/:id/vehicles | GET | List vehicles for a customer | Yes |
| /api/customers/:id/vehicles | POST | Add a vehicle for a customer | Yes |
| /api/appointments | GET | List all appointments (optional status filter) | Yes |
| /api/appointments/:id | GET | Get a single appointment with full detail | Yes |
| /api/appointments | POST | Book a new appointment | Yes |
| /api/appointments/:id | PUT | Update appointment details | Yes |
| /api/appointments/:id/status | PATCH | Update appointment status only | Yes |
| /api/repairs | GET | List repair records (optional appointment_id filter) | Yes |
| /api/repairs/:id | GET | Get a single repair record | Yes |
| /api/repairs | POST | Create a new repair record | Yes |
| /api/repairs/:id | PUT | Update a repair record | Yes |
| /api/billing | GET | List all invoices (optional payment_status filter) | Yes |
| /api/billing/:id | GET | Get a single invoice | Yes |
| /api/billing | POST | Create a new invoice | Yes |
| /api/billing/:id/payment | PATCH | Update payment status | Yes |
| /api/billing/stats/summary | GET | Billing summary totals by status | Yes |
| /api/mechanics | GET | List all active mechanics with job counts | Yes |
| /api/mechanics/:id/appointments | GET | List appointments for a mechanic | Yes |

**Authentication model:**
Okta SSO via GCP IAP (Identity-Aware Proxy). All routes have `auth_enabled: true` in `ci/networking.yaml` — protected at the infrastructure level. The app does not handle authentication in code. Only authenticated Fulcrum employees can reach the application. Authenticated user identity is available in request headers: `X-Goog-Authenticated-User-Email` and `X-Goog-Authenticated-User-Id`.

---

## 3. Data Stores

**Database:** Cloud SQL (PostgreSQL) on shared instance `ai-coe-postgresql-shared`
**Database name:** `vehicle_service_management_db` (underscores required — hyphens cause Terraform destroy errors)
**Schema ownership:** This app owns its schema. Migrations run automatically from `db/migrations/` on every deploy.

**Tables:**
| Table | Purpose | Read/Write |
|---|---|---|
| customers | Customer contact details and addresses | READ + WRITE |
| vehicles | Vehicle records linked to customers (make, model, VIN, license plate) | READ + WRITE |
| mechanics | Mechanic profiles and specializations | READ |
| service_appointments | Appointment bookings with status, service type, assigned mechanic | READ + WRITE |
| repair_records | Work performed, parts used, labor hours, costs — linked to appointments | READ + WRITE |
| billing | Invoices linked to appointments, with payment status and totals | READ + WRITE |

**Seed data:** Migration `0001_seed_demo_data.sql` pre-loads 8 sample customers, 9 vehicles, 10 mechanics, 10 appointments, 4 repair records, and 4 paid invoices for initial testing.

---

## 4. Systems and Data Touched

| System | Type | Access | Data Accessed | Credential |
|---|---|---|---|---|
| Cloud SQL (ai-coe-postgresql-shared) | PostgreSQL database | READ + WRITE | All tables above | vehicle-service-management-db-password (Secret Manager) |

This app does not connect to any external APIs, third-party services, or data sources beyond its own Cloud SQL database.

---

## 5. Credentials Required

| Secret Manager Name | Used For | Injected As |
|---|---|---|
| vehicle-service-management-db-password | PostgreSQL database password | DB_PASSWORD env var |

**Credential lifecycle:** First version created by Terraform on first deploy. Rotation managed manually via GCP Secret Manager outside Terraform.

---

## 6. Risk Assessment

**PII handling:** Yes. The app stores customer personally identifiable information including full names, email addresses, phone numbers, and home addresses. Vehicle data (license plates, VINs) is also stored. All data is held in Cloud SQL within GCP, protected by Okta SSO authentication. No PII is exposed externally.

**Automated decisions:** No. The app does not make automated approvals, scoring, or routing decisions. All status changes are made manually by staff.

**External service calls:** None. All data operations are internal to the app's own Cloud SQL database.

**Risk level:** Medium — due to PII storage (customer contact details). Mitigated by mandatory Okta SSO (all routes protected), GCP-managed database with encrypted storage, and no external egress.

---

## 7. Hosting and Infrastructure

**Target environment:** GCP Cloud Run
**Region:** us-east1
**VPC subnetwork:** `ai-coe-subnet-useast1-apps`
**App URL (post-approval):** `https://vehicle-service-management.ai.fulcrum.tools`
**CI/CD:** Fulcrum shared GitHub Actions workflows — `service-cicd.yml` and `networking.yml` — unchanged from blueprint.
**Container image:** `gcr.io/flcrm-ai/vehicle-service-management` (tag injected by CI at deploy time)

---

## 8. Outstanding Items / Notes

- The seed data migration pre-loads demo customers, vehicles, mechanics, and appointments. On a production deploy, this data will need to be cleaned out or the seed migration skipped once real data is in place.
- Mechanics are seeded read-only for v1. A future update could add a mechanic management screen.
- No pagination is implemented in v1 — data is limited to natural DB row counts. If appointment history grows very large (>10,000 rows), pagination should be added in a future edit.
