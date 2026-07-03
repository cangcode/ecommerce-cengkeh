import { pgTable, foreignKey, unique, bigint, uuid, text, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const fulfillmentStatus = pgEnum("fulfillment_status", ['menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan'])
export const orderStatus = pgEnum("order_status", ['pending', 'paid', 'failed', 'expired'])
export const returnStatus = pgEnum("return_status", ['none', 'requested', 'approved', 'rejected', 'refunded'])
export const shippingMethod = pgEnum("shipping_method", ['ambil_sendiri', 'antarkan'])
export const userRole = pgEnum("user_role", ['admin', 'pembeli', 'penjual'])
export const voucherDiscountType = pgEnum("voucher_discount_type", ['fixed', 'percent', 'per_unit'])
export const weightUnit = pgEnum("weight_unit", ['gram', 'kg'])


export const orders = pgTable("orders", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "orders_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	addressId: bigint("address_id", { mode: "number" }).notNull(),
	midtransOrderId: text("midtrans_order_id").notNull(),
	snapToken: text("snap_token"),
	status: orderStatus().default('pending').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	grossAmount: bigint("gross_amount", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shippingTotal: bigint("shipping_total", { mode: "number" }).default(0).notNull(),
	paymentType: text("payment_type"),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [addresses.addressId],
			name: "orders_address_id_addresses_address_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	unique("orders_midtrans_order_id_unique").on(table.midtransOrderId),
]);

export const orderItems = pgTable("order_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "order_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sellerId: bigint("seller_id", { mode: "number" }).notNull(),
	productTitle: text("product_title").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productPrice: bigint("product_price", { mode: "number" }).notNull(),
	productWeightUnit: weightUnit("product_weight_unit").notNull(),
	quantity: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint({ mode: "number" }).notNull(),
	shippingMethod: shippingMethod("shipping_method").default('antarkan').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shippingCost: bigint("shipping_cost", { mode: "number" }).default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fulfillmentStatus: fulfillmentStatus("fulfillment_status").default('menunggu').notNull(),
	returnStatus: returnStatus("return_status").default('none').notNull(),
	returnReason: text("return_reason"),
	returnRespondedAt: timestamp("return_responded_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellerProfiles.id],
			name: "order_items_seller_id_seller_profiles_id_fk"
		}),
]);

export const vouchers = pgTable("vouchers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "vouchers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sellerId: bigint("seller_id", { mode: "number" }).notNull(),
	code: text().notNull(),
	discountType: voucherDiscountType("discount_type").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	discountValue: bigint("discount_value", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	maxDiscount: bigint("max_discount", { mode: "number" }),
	usageLimit: integer("usage_limit").default(1).notNull(),
	usedCount: integer("used_count").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellerProfiles.id],
			name: "vouchers_seller_id_seller_profiles_id_fk"
		}),
	unique("vouchers_code_unique").on(table.code),
]);

export const products = pgTable("products", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "products_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sellerId: bigint("seller_id", { mode: "number" }).notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	price: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wholesalePrice: bigint("wholesale_price", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wholesaleQty: bigint("wholesale_qty", { mode: "number" }),
	weightUnit: weightUnit("weight_unit").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	stock: bigint({ mode: "number" }).notNull(),
	imageUrl: jsonb("image_url").default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	buyerCount: integer("buyer_count").default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	soldCount: bigint("sold_count", { mode: "number" }).default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellerProfiles.id],
			name: "products_seller_id_seller_profiles_id_fk"
		}),
	unique("products_slug_unique").on(table.slug),
]);

export const addresses = pgTable("addresses", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	addressId: bigint("address_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "addresses_address_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	recipientName: text("recipient_name").notNull(),
	phone: text().notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	address: text().notNull(),
	districtId: text("district_id").notNull(),
	villageId: text("village_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.districtId],
			foreignColumns: [districts.id],
			name: "addresses_district_id_districts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "addresses_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.villageId],
			foreignColumns: [villages.id],
			name: "addresses_village_id_villages_id_fk"
		}),
]);

export const villages = pgTable("villages", {
	id: text().primaryKey().notNull(),
	districtId: text("district_id").notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const districts = pgTable("districts", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	avatarUrl: text("avatar_url"),
	emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: 'string' }),
	role: userRole().default('pembeli').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	addressId: bigint("address_id", { mode: "number" }),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const sellerProfiles = pgTable("seller_profiles", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "seller_profiles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	businessName: text("business_name").notNull(),
	businessAddress: text("business_address").notNull(),
	districtId: text("district_id").notNull(),
	villageId: text("village_id").notNull(),
	description: text(),
	phone: text(),
}, (table) => [
	foreignKey({
			columns: [table.districtId],
			foreignColumns: [districts.id],
			name: "seller_profiles_district_id_districts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "seller_profiles_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.villageId],
			foreignColumns: [villages.id],
			name: "seller_profiles_village_id_villages_id_fk"
		}),
]);

export const charts = pgTable("charts", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "charts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "charts_user_id_users_id_fk"
		}),
]);

export const chartItems = pgTable("chart_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "chart_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	chartId: bigint("chart_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chartId],
			foreignColumns: [charts.id],
			name: "chart_items_chart_id_charts_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "chart_items_product_id_products_id_fk"
		}),
]);
