import { Router, Request, Response } from "express";
import { query } from "../db.js";

export const billingRouter = Router();

// GET /api/billing
billingRouter.get("/", async (req: Request, res: Response) => {
  const { payment_status } = req.query as { payment_status?: string };
  try {
    const params: unknown[] = [];
    const where = payment_status ? `WHERE b.payment_status = $${params.push(payment_status)}` : "";
    const rows = await query(`
      SELECT b.*,
        c.first_name AS customer_first, c.last_name AS customer_last, c.email AS customer_email,
        a.service_type, a.appointment_date,
        v.make, v.model, v.year, v.license_plate
      FROM billing b
      JOIN customers c ON c.id = b.customer_id
      JOIN service_appointments a ON a.id = b.appointment_id
      JOIN vehicles v ON v.id = a.vehicle_id
      ${where}
      ORDER BY b.invoice_date DESC
    `, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch billing records" });
  }
});

// GET /api/billing/:id
billingRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT b.*,
        c.first_name AS customer_first, c.last_name AS customer_last,
        c.email AS customer_email, c.phone AS customer_phone,
        a.service_type, a.appointment_date,
        v.make, v.model, v.year, v.license_plate
      FROM billing b
      JOIN customers c ON c.id = b.customer_id
      JOIN service_appointments a ON a.id = b.appointment_id
      JOIN vehicles v ON v.id = a.vehicle_id
      WHERE b.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Invoice not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// POST /api/billing
billingRouter.post("/", async (req: Request, res: Response) => {
  const { appointment_id, customer_id, subtotal, tax_rate, notes } = req.body as Record<string, string>;
  if (!appointment_id || !customer_id || !subtotal) {
    return res.status(400).json({ error: "appointment_id, customer_id, and subtotal are required" });
  }
  const subtotalNum = Number(subtotal);
  const taxRateNum = tax_rate ? Number(tax_rate) : 0.08;
  const taxAmount = Math.round(subtotalNum * taxRateNum * 100) / 100;
  const totalAmount = Math.round((subtotalNum + taxAmount) * 100) / 100;
  try {
    const rows = await query(
      `INSERT INTO billing (appointment_id, customer_id, subtotal, tax_rate, tax_amount, total_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [appointment_id, customer_id, subtotalNum, taxRateNum, taxAmount, totalAmount, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// PATCH /api/billing/:id/payment — mark as paid
billingRouter.patch("/:id/payment", async (req: Request, res: Response) => {
  const { payment_status, payment_method } = req.body as { payment_status: string; payment_method?: string };
  const valid = ["pending", "paid", "partial", "overdue"];
  if (!valid.includes(payment_status)) {
    return res.status(400).json({ error: `payment_status must be one of: ${valid.join(", ")}` });
  }
  try {
    const paidAt = payment_status === "paid" ? "NOW()" : "NULL";
    const rows = await query(
      `UPDATE billing SET payment_status=$1, payment_method=$2, paid_at=${paidAt}, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [payment_status, payment_method ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Invoice not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// GET /api/billing/stats/summary
billingRouter.get("/stats/summary", async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        COUNT(*) FILTER (WHERE payment_status = 'pending')::int AS pending_count,
        COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_count,
        COUNT(*) FILTER (WHERE payment_status = 'overdue')::int AS overdue_count,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'pending'), 0)::numeric AS pending_total,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS paid_total,
        COALESCE(SUM(total_amount), 0)::numeric AS overall_total
      FROM billing
    `);
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to fetch billing summary" });
  }
});
