import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  order_items,
  orders,
  chart_items,
  charts,
  products,
  vouchers,
  testimonials,
  addresses,
  seller_profiles,
  users,
  villages,
  districts,
} from "../src/db/schema";

async function main() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 15,
    connect_timeout: 30,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(client);

  console.log("🧹 Membersihkan database...\n");

  // Delete dalam urutan yang aman (respect FK constraints)
  const tables = [
    { name: "order_items", fn: () => db.delete(order_items) },
    { name: "orders", fn: () => db.delete(orders) },
    { name: "chart_items", fn: () => db.delete(chart_items) },
    { name: "charts", fn: () => db.delete(charts) },
    { name: "vouchers", fn: () => db.delete(vouchers) },
    { name: "testimonials", fn: () => db.delete(testimonials) },
    { name: "products", fn: () => db.delete(products) },
    { name: "addresses", fn: () => db.delete(addresses) },
    { name: "seller_profiles", fn: () => db.delete(seller_profiles) },
    { name: "users", fn: () => db.delete(users) },
    { name: "villages", fn: () => db.delete(villages) },
    { name: "districts", fn: () => db.delete(districts) },
  ];

  for (const table of tables) {
    try {
      await table.fn();
      console.log(`✅ ${table.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${table.name}: ${msg}`);
    }
  }

  console.log("\n✨ Database berhasil dibersihkan!");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Gagal:", err);
  process.exit(1);
});
