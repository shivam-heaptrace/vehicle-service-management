import pg from "pg";
const { Pool } = pg;

// Cloud Run connects to Cloud SQL via Unix socket — never TCP.
// DB_HOST and DB_PORT must NOT be set. Connection uses CLOUDSQL_CONNECTION_NAME.
const user = process.env.DB_USER ?? "";
const password = process.env.DB_PASSWORD ?? "";
const dbName = process.env.DB_NAME ?? "";
const connName = process.env.CLOUDSQL_CONNECTION_NAME ?? "";

// URL-encode password — it may contain special characters
const connectionString =
  process.env.NODE_ENV === "production"
    ? `postgresql://${user}:${encodeURIComponent(password)}@/${dbName}?host=/cloudsql/${connName}`
    : `postgresql://${user}:${encodeURIComponent(password)}@localhost:5432/${dbName}`;

const pool = new Pool({ connectionString });

console.log("[db] connecting to", {
  dbName,
  user,
  mode: process.env.NODE_ENV === "production" ? "unix-socket" : "local-tcp",
});

pool.on("error", (err) => {
  console.error("[db] pool error:", err.message);
});

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } catch (err) {
    console.error("[db] query error:", err instanceof Error ? err.message : err);
    throw err;
  } finally {
    client.release();
  }
}
