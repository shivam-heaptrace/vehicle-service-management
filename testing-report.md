# testing-report.md — Vehicle Service Management System

> **Review document for COE human approval.** Documents test results proving the app
> works correctly and fails safely. Must be complete before submission.

**Test date:** 2026-07-01
**Tested by:** Claude COE Builder (baseline)
**Branch:** feature/initial-app

---

## 1. Happy Path — Core Functionality

**Scenario 1 — Book a service appointment**

Steps:
1. Log in via Okta SSO
2. Navigate to Appointments tab
3. Click "Book Appointment"
4. Select an existing customer and their vehicle
5. Assign a mechanic, set date/time, enter service type
6. Submit — appointment appears in list with status "Scheduled"

**Result:** NOT YET TESTED — requires staging deploy
**Notes:** API routes `POST /api/appointments` and `GET /api/appointments` are verified to exist and return correct structure from code review.

**Scenario 2 — Mechanic updates repair status**

Steps:
1. Navigate to Appointments tab
2. Find a "Scheduled" appointment and click "Start" — status moves to "In Progress"
3. Click "Complete" — status moves to "Completed"

**Result:** NOT YET TESTED — requires staging deploy

**Scenario 3 — Generate and pay an invoice**

Steps:
1. Navigate to Billing tab
2. Verify pre-seeded invoices appear with correct totals
3. Click "Mark Paid" on a pending invoice
4. Confirm payment status updates to "Paid"

**Result:** NOT YET TESTED — requires staging deploy

---

## 2. Health Check

**Endpoint:** `GET /api/health`
**Expected:** `{ "ok": true, "service": "vehicle-service-management" }` — HTTP 200
**Result:** PASSED (verified from source: `src/index.ts` line `app.get("/api/health", ...)`)

---

## 3. API Error Handling

**Scenario:** Downstream failure — DB unavailable

**Test method:** Code review of all route handlers for error catch blocks

**Expected:** HTTP 500 with `{ "error": "..." }` — no stack traces, paths, secret values, or internal hostnames in response.

**Code pattern used in all routes:**
```
catch {
  res.status(500).json({ error: "Human-readable message" });
}
```

**Result:** PASSED (code review) — all 20+ route handlers use this pattern. Internal DB errors are logged server-side via `console.error` and never surfaced to the HTTP response body.

---

## 4. Authentication Boundary

**Scenario:** Unauthenticated user attempts to access the app.

**Test method:** `ci/networking.yaml` reviewed — `auth_enabled: true` on `/*` (catch-all)

**Expected:** Redirect to Okta login. App content not visible.

**Result:** PASSED (configuration verified) — requires staging deploy for full end-to-end confirmation.

**Note:** Auth is enforced at the IAP/infrastructure layer. No auth logic in application code. The `/*` catch-all with `auth_enabled: true` in `ci/networking.yaml` covers all routes.

---

## 5. Database / Schema Verification

**Schema initialization method:** SQL migration files in `db/migrations/`, executed automatically by the CI pipeline on every deploy in filename order.

**Migration files:**
| File | Purpose |
|---|---|
| `0000_create_tables.sql` | Creates all 6 tables with `IF NOT EXISTS` — safe to re-run |
| `0001_seed_demo_data.sql` | Seeds demo data with `ON CONFLICT DO NOTHING` — safe to re-run |

**Tables created:**
| Table | Purpose | Verified |
|---|---|---|
| customers | Customer PII and contact info | Code review PASSED |
| vehicles | Vehicle records | Code review PASSED |
| mechanics | Mechanic profiles | Code review PASSED |
| service_appointments | Appointment bookings | Code review PASSED |
| repair_records | Work performed and costs (computed `total_cost` column) | Code review PASSED |
| billing | Invoices and payment tracking | Code review PASSED |

**DB name validation:** `vehicle_service_management_db` — underscores only ✓ (no hyphens)
**Connection method:** Unix socket via `CLOUDSQL_CONNECTION_NAME` — no `DB_HOST` or `DB_PORT` used ✓
**Migrations location:** `db/migrations/` not `src/` ✓
**SQL file authoring:** Python file-write — no bash heredocs used ✓
**Doubled-quote check:** `grep "''" db/migrations/*.sql` — PASSED (no doubled quotes found) ✓

**Seed data:** 8 customers, 9 vehicles, 10 mechanics, 10 appointments, 4 repair records, 4 billing records pre-loaded.

**Result:** PASSED (code review) — full verification requires staging deploy.

---

## 6. File Upload Test

Not applicable — this app does not include file upload functionality.

---

## 7. Edge Cases and Known Limitations

| Scenario | Expected Behavior | Status |
|---|---|---|
| Empty appointment list | "No appointments found" empty state shown | NOT YET TESTED |
| Booking without selecting a vehicle | Form validation prevents submit | NOT YET TESTED |
| Duplicate customer email | API returns 409 with human-readable error | PASSED (code review — unique constraint + catch block) |
| Duplicate license plate | API returns 409 with human-readable error | PASSED (code review) |
| Invalid appointment status value | API returns 400 with allowed values listed | PASSED (code review) |
| Invalid payment status value | API returns 400 with allowed values listed | PASSED (code review) |
| No mechanics available | Appointment books with mechanic unassigned | PASSED (mechanic_id nullable) |
| Concurrent status updates | Last-write-wins — no optimistic locking in v1 | KNOWN LIMITATION |

**Known limitations:**
- No pagination — data is returned in full. If appointment or billing history grows very large (>10,000 rows), a future edit should add limit/offset pagination.
- No optimistic locking — concurrent edits to the same appointment record will result in last-write-wins behaviour.
- Mechanics are seeded only — no mechanic management UI in v1.
- No email notifications — appointment confirmations or status changes do not trigger emails in v1.

---

## 8. Security Spot Checks

| Check | Method | Result |
|---|---|---|
| No secrets in source code | Code review: no hardcoded passwords, API keys, or tokens in any `.ts` file | PASSED |
| No secrets in Dockerfile | Dockerfile reviewed — no ENV statements with values | PASSED |
| All env vars reference Secret Manager names only | `ci/service.yaml` reviewed — `secret_env_vars` contains only the secret name, not value | PASSED |
| No hardcoded URLs or internal hostnames | Code review — all config via env vars | PASSED |
| Error responses don't leak internals | See Section 3 above — all routes use safe error pattern | PASSED |
| No `DB_HOST` or `DB_PORT` in any config | Verified — only `CLOUDSQL_CONNECTION_NAME` used for DB connection | PASSED |
| Migrations in `db/migrations/` not `src/` | Verified — both SQL files are at `db/migrations/NNNN_*.sql` | PASSED |
| No doubled single-quotes in SQL files | `grep "''" db/migrations/*.sql` returned no output | PASSED |
| Fulcrum Design System loaded | `public/index.html` loads `colors_and_type.css` and `tokens.css` before Tailwind | PASSED |
| No hardcoded hex colors in HTML/CSS | All colors use `var(--token)` references | PASSED |

---

## 9. Blueprint Resolution Audit

| Check | Result |
|---|---|
| Blueprint source | Fetched from GitHub MCP via `preview_blueprint_files`; all 5 structural assertions validated against `blueprint-reference.md` — PASSED |
| VPC subnetwork | `projects/flcrm-ai/regions/us-east1/subnetworks/ai-coe-subnet-useast1-apps` ✓ |
| wif_okta_groups | `gcp-ai-coe-standard` present ✓ |
| app_type | `default` in both `ci/service.yaml` and `ci/networking.yaml` ✓ |
| service-cicd.yml uses | `flcrm-ai/gcp-architecture/.github/workflows/service-cicd.yml@main` ✓ |
| networking.yml uses | `flcrm-ai/gcp-architecture/.github/workflows/networking.yml@main` ✓ |

---

## 10. Reviewer Notes

- All database connection uses Unix socket (never TCP) — correct pattern for Cloud Run + Cloud SQL.
- `DB_NAME` env var and `cloudsql_dbname` both use `vehicle_service_management_db` with underscores — prevents Terraform destroy issue.
- All API error handlers suppress internals — only human-readable messages returned to the browser.
- React 18 UMD is used (no JSX, no Babel) — multi-view app with Dashboard, Appointments, Customers, Mechanics, and Billing tabs justified the React choice over Vanilla JS.
- Seed data uses `ON CONFLICT DO NOTHING` throughout — safe to re-run migrations.
