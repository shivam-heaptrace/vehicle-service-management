import { Router, Request, Response } from "express";
import { query } from "../db.js";

export const customersRouter = Router();

// GET /api/customers
customersRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT c.*, COUNT(v.id)::int AS vehicle_count
      FROM customers c
      LEFT JOIN vehicles v ON v.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.last_name, c.first_name
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// GET /api/customers/:id
customersRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const rows = await query("SELECT * FROM customers WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Customer not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// POST /api/customers
customersRouter.post("/", async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, address } = req.body as Record<string, string>;
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "first_name, last_name, and email are required" });
  }
  try {
    const rows = await query(
      `INSERT INTO customers (first_name, last_name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [first_name, last_name, email, phone ?? null, address ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return res.status(409).json({ error: "A customer with that email already exists" });
    }
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// PUT /api/customers/:id
customersRouter.put("/:id", async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, address } = req.body as Record<string, string>;
  try {
    const rows = await query(
      `UPDATE customers SET first_name=$1, last_name=$2, email=$3, phone=$4, address=$5,
       updated_at=NOW() WHERE id=$6 RETURNING *`,
      [first_name, last_name, email, phone ?? null, address ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Customer not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// GET /api/customers/:id/vehicles
customersRouter.get("/:id/vehicles", async (req: Request, res: Response) => {
  try {
    const rows = await query(
      "SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY year DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// POST /api/vehicles
customersRouter.post("/:id/vehicles", async (req: Request, res: Response) => {
  const { make, model, year, license_plate, vin, color, mileage } = req.body as Record<string, string>;
  if (!make || !model || !year || !license_plate) {
    return res.status(400).json({ error: "make, model, year, and license_plate are required" });
  }
  try {
    const rows = await query(
      `INSERT INTO vehicles (customer_id, make, model, year, license_plate, vin, color, mileage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, make, model, Number(year), license_plate, vin ?? null, color ?? null, mileage ? Number(mileage) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return res.status(409).json({ error: "A vehicle with that license plate or VIN already exists" });
    }
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});
