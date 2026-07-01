import { Router, Request, Response } from "express";
import { query } from "../db.js";

export const appointmentsRouter = Router();

// GET /api/appointments — with optional status filter
appointmentsRouter.get("/", async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  try {
    const params: unknown[] = [];
    const where = status ? `WHERE a.status = $${params.push(status)}` : "";
    const rows = await query(`
      SELECT
        a.*,
        v.make, v.model, v.year, v.license_plate,
        c.first_name AS customer_first, c.last_name AS customer_last, c.email AS customer_email,
        m.first_name AS mechanic_first, m.last_name AS mechanic_last
      FROM service_appointments a
      JOIN vehicles v ON v.id = a.vehicle_id
      JOIN customers c ON c.id = a.customer_id
      LEFT JOIN mechanics m ON m.id = a.mechanic_id
      ${where}
      ORDER BY a.appointment_date ASC
    `, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// GET /api/appointments/:id
appointmentsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        a.*,
        v.make, v.model, v.year, v.license_plate, v.color, v.mileage,
        c.first_name AS customer_first, c.last_name AS customer_last,
        c.email AS customer_email, c.phone AS customer_phone,
        m.first_name AS mechanic_first, m.last_name AS mechanic_last
      FROM service_appointments a
      JOIN vehicles v ON v.id = a.vehicle_id
      JOIN customers c ON c.id = a.customer_id
      LEFT JOIN mechanics m ON m.id = a.mechanic_id
      WHERE a.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Appointment not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

// POST /api/appointments
appointmentsRouter.post("/", async (req: Request, res: Response) => {
  const { vehicle_id, customer_id, mechanic_id, appointment_date, service_type, description, estimated_hours, notes } =
    req.body as Record<string, string>;
  if (!vehicle_id || !customer_id || !appointment_date || !service_type) {
    return res.status(400).json({ error: "vehicle_id, customer_id, appointment_date, and service_type are required" });
  }
  try {
    const rows = await query(
      `INSERT INTO service_appointments
       (vehicle_id, customer_id, mechanic_id, appointment_date, service_type, description, estimated_hours, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [vehicle_id, customer_id, mechanic_id ?? null, appointment_date, service_type,
       description ?? null, estimated_hours ? Number(estimated_hours) : null, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

// PATCH /api/appointments/:id/status — update status only
appointmentsRouter.patch("/:id/status", async (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const validStatuses = ["scheduled", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
  }
  try {
    const rows = await query(
      "UPDATE service_appointments SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Appointment not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update appointment status" });
  }
});

// PUT /api/appointments/:id
appointmentsRouter.put("/:id", async (req: Request, res: Response) => {
  const { mechanic_id, appointment_date, status, service_type, description, estimated_hours, notes } =
    req.body as Record<string, string>;
  try {
    const rows = await query(
      `UPDATE service_appointments SET
       mechanic_id=$1, appointment_date=$2, status=$3, service_type=$4,
       description=$5, estimated_hours=$6, notes=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [mechanic_id ?? null, appointment_date, status, service_type,
       description ?? null, estimated_hours ? Number(estimated_hours) : null,
       notes ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Appointment not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update appointment" });
  }
});
