import { Router, Request, Response } from "express";
import { query } from "../db.js";

export const repairsRouter = Router();

// GET /api/repairs?appointment_id=N
repairsRouter.get("/", async (req: Request, res: Response) => {
  const { appointment_id } = req.query as { appointment_id?: string };
  try {
    const params: unknown[] = [];
    const where = appointment_id ? `WHERE r.appointment_id = $${params.push(Number(appointment_id))}` : "";
    const rows = await query(`
      SELECT r.*,
        m.first_name AS mechanic_first, m.last_name AS mechanic_last,
        a.service_type, a.vehicle_id
      FROM repair_records r
      LEFT JOIN mechanics m ON m.id = r.mechanic_id
      JOIN service_appointments a ON a.id = r.appointment_id
      ${where}
      ORDER BY r.created_at DESC
    `, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch repair records" });
  }
});

// GET /api/repairs/:id
repairsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT r.*,
        m.first_name AS mechanic_first, m.last_name AS mechanic_last
      FROM repair_records r
      LEFT JOIN mechanics m ON m.id = r.mechanic_id
      WHERE r.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Repair record not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to fetch repair record" });
  }
});

// POST /api/repairs
repairsRouter.post("/", async (req: Request, res: Response) => {
  const { appointment_id, mechanic_id, work_performed, parts_used, labor_hours, parts_cost, labor_cost } =
    req.body as Record<string, string>;
  if (!appointment_id || !work_performed) {
    return res.status(400).json({ error: "appointment_id and work_performed are required" });
  }
  try {
    const rows = await query(
      `INSERT INTO repair_records (appointment_id, mechanic_id, work_performed, parts_used, labor_hours, parts_cost, labor_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [appointment_id, mechanic_id ?? null, work_performed, parts_used ?? null,
       Number(labor_hours ?? 0), Number(parts_cost ?? 0), Number(labor_cost ?? 0)]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to create repair record" });
  }
});

// PUT /api/repairs/:id
repairsRouter.put("/:id", async (req: Request, res: Response) => {
  const { mechanic_id, work_performed, parts_used, labor_hours, parts_cost, labor_cost, status, started_at, completed_at } =
    req.body as Record<string, string>;
  try {
    const rows = await query(
      `UPDATE repair_records SET
       mechanic_id=$1, work_performed=$2, parts_used=$3, labor_hours=$4,
       parts_cost=$5, labor_cost=$6, status=$7, started_at=$8, completed_at=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [mechanic_id ?? null, work_performed, parts_used ?? null, Number(labor_hours ?? 0),
       Number(parts_cost ?? 0), Number(labor_cost ?? 0), status,
       started_at ?? null, completed_at ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Repair record not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update repair record" });
  }
});
