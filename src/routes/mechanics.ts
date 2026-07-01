import { Router, Request, Response } from "express";
import { query } from "../db.js";

export const mechanicsRouter = Router();

// GET /api/mechanics
mechanicsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT m.*,
        COUNT(a.id) FILTER (WHERE a.status = 'in_progress')::int AS active_jobs,
        COUNT(a.id) FILTER (WHERE a.status = 'completed')::int AS completed_jobs
      FROM mechanics m
      LEFT JOIN service_appointments a ON a.mechanic_id = m.id
      WHERE m.is_active = TRUE
      GROUP BY m.id
      ORDER BY m.last_name, m.first_name
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch mechanics" });
  }
});

// GET /api/mechanics/:id/appointments
mechanicsRouter.get("/:id/appointments", async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT a.*,
        v.make, v.model, v.year, v.license_plate,
        c.first_name AS customer_first, c.last_name AS customer_last
      FROM service_appointments a
      JOIN vehicles v ON v.id = a.vehicle_id
      JOIN customers c ON c.id = a.customer_id
      WHERE a.mechanic_id = $1
      ORDER BY a.appointment_date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch mechanic appointments" });
  }
});
