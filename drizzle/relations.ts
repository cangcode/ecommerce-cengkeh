import { relations } from "drizzle-orm/relations";
import { addresses, orders, users, orderItems, products, sellerProfiles, vouchers, districts, villages, charts, chartItems } from "./schema";

export const ordersRelations = relations(orders, ({one, many}) => ({
	address: one(addresses, {
		fields: [orders.addressId],
		references: [addresses.addressId]
	}),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	orderItems: many(orderItems),
}));

export const addressesRelations = relations(addresses, ({one, many}) => ({
	orders: many(orders),
	district: one(districts, {
		fields: [addresses.districtId],
		references: [districts.id]
	}),
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
	village: one(villages, {
		fields: [addresses.villageId],
		references: [villages.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	orders: many(orders),
	addresses: many(addresses),
	sellerProfiles: many(sellerProfiles),
	charts: many(charts),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
	sellerProfile: one(sellerProfiles, {
		fields: [orderItems.sellerId],
		references: [sellerProfiles.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	orderItems: many(orderItems),
	sellerProfile: one(sellerProfiles, {
		fields: [products.sellerId],
		references: [sellerProfiles.id]
	}),
	chartItems: many(chartItems),
}));

export const sellerProfilesRelations = relations(sellerProfiles, ({one, many}) => ({
	orderItems: many(orderItems),
	vouchers: many(vouchers),
	products: many(products),
	district: one(districts, {
		fields: [sellerProfiles.districtId],
		references: [districts.id]
	}),
	user: one(users, {
		fields: [sellerProfiles.userId],
		references: [users.id]
	}),
	village: one(villages, {
		fields: [sellerProfiles.villageId],
		references: [villages.id]
	}),
}));

export const vouchersRelations = relations(vouchers, ({one}) => ({
	sellerProfile: one(sellerProfiles, {
		fields: [vouchers.sellerId],
		references: [sellerProfiles.id]
	}),
}));

export const districtsRelations = relations(districts, ({many}) => ({
	addresses: many(addresses),
	sellerProfiles: many(sellerProfiles),
}));

export const villagesRelations = relations(villages, ({many}) => ({
	addresses: many(addresses),
	sellerProfiles: many(sellerProfiles),
}));

export const chartsRelations = relations(charts, ({one, many}) => ({
	user: one(users, {
		fields: [charts.userId],
		references: [users.id]
	}),
	chartItems: many(chartItems),
}));

export const chartItemsRelations = relations(chartItems, ({one}) => ({
	chart: one(charts, {
		fields: [chartItems.chartId],
		references: [charts.id]
	}),
	product: one(products, {
		fields: [chartItems.productId],
		references: [products.id]
	}),
}));