import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetchh as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, {
  prepare: false,
  max: 20,
  idle_timeout: 15,
  max_lifetime: 60 * 5,
  connect_timeout: 30,
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(client);
