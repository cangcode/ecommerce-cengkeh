import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  bigint,
  jsonb,
  text,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin", "pembeli", "penjual"]);

// table user
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  role: roleEnum("role").default("pembeli").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  // Catatan: Jika Anda nanti membuat tabel 'addresses', kolom ini bisa disambung dengan .references(() => addresses.id)
  addressId: bigint("address_id", { mode: "number" }),
});

// table products
export const weightUnitEnum = pgEnum("weight_unit", ["gram", "kg"]);
export const products = pgTable("products", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  seller_id: bigint("seller_id", { mode: "number" })
    .notNull()
    .references(() => seller_profiles.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  price: bigint("price", { mode: "number" }).notNull(),
  wholesale_price: bigint("wholesale_price", { mode: "number" }),
  wholesale_qty: bigint("wholesale_qty", {
    mode: "number",
  }),
  weight_unit: weightUnitEnum("weight_unit").notNull(),
  stock: bigint("stock", {
    mode: "number",
  }).notNull(),
  image_url: jsonb("image_url")
    .$type<
      {
        public_id: string;
        secure_url: string;
      }[]
    >()
    .notNull()
    .default([]),
  created_at: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
  updated_at: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow(),
});

export const seller_profiles = pgTable("seller_profiles", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  business_name: text("business_name").notNull(),
  business_address: text("business_address").notNull(),
  district_id: text("district_id").notNull(),
  village_id: text("village_id").notNull(),
  description: text("description"),
});
