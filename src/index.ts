import express, { Request, Response, NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { customersRouter } from "./routes/customers.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { repairsRouter } from "./routes/repairs.js";
import { billingRouter } from "./routes/billing.js";
import { mechanicsRouter } from "./routes/mechanics.js";

const app = express();
const PORT = Number(process.env.PORT ?? 8080);

app.use(express.json());

// ── Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "vehicle-service-management" });
});

// ── Current user from IAP header
app.get("/api/me", (req: Request, res: Response) => {
  const raw = req.headers["x-goog-authenticated-user-email"] as string | undefined;
  const email = raw?.split(":")?.[1] ?? "unknown";
  res.json({ email });
});

// ── API routes
app.use("/api/customers", customersRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/repairs", repairsRouter);
app.use("/api/billing", billingRouter);
app.use("/api/mechanics", mechanicsRouter);

// ── Dashboard summary
app.get("/api/dashboard", async (_req: Request, res: Response) => {
  try {
    const { query } = await import("./db.js");
    const [apptStats] = await query<Record<string, number>>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_today,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
      FROM service_appointments
      WHERE appointment_date >= CURRENT_DATE AND appointment_date < CURRENT_DATE + INTERVAL '1 day'
        OR status = 'in_progress'
    `);
    const [customerCount] = await query<{ count: number }>("SELECT COUNT(*)::int AS count FROM customers");
    const [vehicleCount] = await query<{ count: number }>("SELECT COUNT(*)::int AS count FROM vehicles");
    const [billingPending] = await query<{ total: number }>(
      "SELECT COALESCE(SUM(total_amount),0)::numeric AS total FROM billing WHERE payment_status = 'pending'"
    );
    res.json({
      appointments: apptStats,
      total_customers: customerCount?.count ?? 0,
      total_vehicles: vehicleCount?.count ?? 0,
      pending_billing_total: billingPending?.total ?? 0,
    });
  } catch {
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// ── Static files — MUST come before the catch-all
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.use(express.static(publicDir));

// ── SPA catch-all — MUST come after express.static
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ── Error handler — MUST be last, after static and catch-all
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] unhandled error:", err.message);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`vehicle-service-management running on port ${PORT}`);
});
