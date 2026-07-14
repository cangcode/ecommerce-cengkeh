import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  bigint,
  jsonb,
  text,
  integer,
  real,
  boolean,
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

  addressId: bigint("address_id", { mode: "number" }),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
});

export const addresses = pgTable("addresses", {
  id: bigint("address_id", { mode: "number" })
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  district_id: text("district_id")
    .notNull()
    .references(() => districts.id),
  village_id: text("village_id")
    .notNull()
    .references(() => villages.id),
  recipient_name: text("recipient_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  is_default: boolean("is_default").notNull().default(false),
});

// table product
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
  buyer_count: integer("buyer_count").notNull().default(0),
  sold_count: bigint("sold_count", { mode: "number" }).notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
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
  phone: text("phone"),
  district_id: text("district_id")
    .notNull()
    .references(() => districts.id),
  village_id: text("village_id")
    .notNull()
    .references(() => villages.id),
  description: text("description"),
});

// table districts (cache dari Binderbyte)
export const districts = pgTable("districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// table villages (cache dari Binderbyte)
export const villages = pgTable("villages", {
  id: text("id").primaryKey(),
  district_id: text("district_id").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// table charts (keranjang belanja)
export const charts = pgTable("charts", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// table chart_items (item di dalam keranjang)
export const chart_items = pgTable("chart_items", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  chart_id: bigint("chart_id", { mode: "number" })
    .notNull()
    .references(() => charts.id),
  product_id: bigint("product_id", { mode: "number" })
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── ENUM ──
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "expired",
]);

export const shippingMethodEnum = pgEnum("shipping_method", [
  "ambil_sendiri",
  "antarkan",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "menunggu",
  "diproses",
  "dikirim",
  "selesai",
  "dibatalkan",
]);

export const returnStatusEnum = pgEnum("return_status", [
  "none",
  "requested",
  "approved",
  "rejected",
  "refunded",
]);

export const cancellationStatusEnum = pgEnum("cancellation_status", [
  "none",
  "requested",
  "approved",
  "rejected",
]);

// table orders (satu row = satu checkout)
export const orders = pgTable("orders", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  address_id: bigint("address_id", { mode: "number" })
    .notNull()
    .references(() => addresses.id),
  midtrans_order_id: text("midtrans_order_id").notNull().unique(),
  snap_token: text("snap_token"),
  status: orderStatusEnum("status").notNull().default("pending"),
  gross_amount: bigint("gross_amount", { mode: "number" }).notNull(),
  shipping_total: bigint("shipping_total", { mode: "number" })
    .notNull()
    .default(0),
  payment_type: text("payment_type"),
  paid_at: timestamp("paid_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// table order_items (detail item per produk di satu order)
export const order_items = pgTable("order_items", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  order_id: bigint("order_id", { mode: "number" })
    .notNull()
    .references(() => orders.id),
  product_id: bigint("product_id", { mode: "number" })
    .notNull()
    .references(() => products.id),
  seller_id: bigint("seller_id", { mode: "number" })
    .notNull()
    .references(() => seller_profiles.id),
  product_title: text("product_title").notNull(),
  product_price: bigint("product_price", { mode: "number" }).notNull(),
  product_weight_unit: weightUnitEnum("product_weight_unit").notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: bigint("subtotal", { mode: "number" }).notNull(),
  shipping_method: shippingMethodEnum("shipping_method")
    .notNull()
    .default("antarkan"),
  shipping_cost: bigint("shipping_cost", { mode: "number" })
    .notNull()
    .default(0),
  fulfillment_status: fulfillmentStatusEnum("fulfillment_status")
    .notNull()
    .default("menunggu"),
  return_status: returnStatusEnum("return_status").notNull().default("none"),
  return_reason: text("return_reason"),
  return_responded_at: timestamp("return_responded_at", { withTimezone: true }),
  cancellation_status: cancellationStatusEnum("cancellation_status")
    .notNull()
    .default("none"),
  cancel_reason: text("cancel_reason"),
  cancel_responded_at: timestamp("cancel_responded_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── VOUCHER ──
export const voucherDiscountEnum = pgEnum("voucher_discount_type", [
  "fixed",
  "percent",
  "per_unit",
]);

export const vouchers = pgTable("vouchers", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  seller_id: bigint("seller_id", { mode: "number" })
    .notNull()
    .references(() => seller_profiles.id),
  code: text("code").notNull().unique(),
  discount_type: voucherDiscountEnum("discount_type").notNull(),
  discount_value: bigint("discount_value", { mode: "number" }).notNull(),
  max_discount: bigint("max_discount", { mode: "number" }),
  usage_limit: integer("usage_limit").notNull().default(1),
  used_count: integer("used_count").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── TESTIMONIALS ──
export const testimonials = pgTable("testimonials", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  quote: text("quote").notNull(),
  rating: integer("rating").notNull().default(5),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
