"use server";

import { db } from "@/index";
import { orders, order_items, users } from "@/db/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";

export type SalesReportItem = {
  order_id: number;
  xendit_invoice_id: string;
  buyer_name: string | null;
  status: "pending" | "paid" | "failed" | "expired";
  created_at: Date;
  paid_at: Date | null;
  item_count: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: {
    id: number;
    product_title: string;
    product_price: number;
    quantity: number;
    product_weight_unit: string;
    subtotal: number;
  }[];
};

export type SalesReportSummary = {
  totalPaidRevenue: number;
  totalPaidOrders: number;
  totalOrders: number;
  averagePerOrder: number;
};

export type SalesReport = {
  items: SalesReportItem[];
  summary: SalesReportSummary;
};

export async function getSalesReport(
  sellerId: number,
  dateFrom?: string,
  dateTo?: string,
): Promise<SalesReport> {
  // Build conditions
  const conditions = [eq(order_items.seller_id, sellerId)];

  if (dateFrom) {
    conditions.push(gte(orders.created_at, new Date(dateFrom)));
  }
  if (dateTo) {
    // include whole day
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(orders.created_at, endDate));
  }

  const sellerItems = await db
    .select({
      id: order_items.id,
      order_id: order_items.order_id,
      product_title: order_items.product_title,
      product_price: order_items.product_price,
      quantity: order_items.quantity,
      product_weight_unit: order_items.product_weight_unit,
      subtotal: order_items.subtotal,
      shipping_cost: order_items.shipping_cost,
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.order_id, orders.id))
    .where(and(...conditions))
    .orderBy(order_items.order_id);

  if (!sellerItems.length) {
    return {
      items: [],
      summary: {
        totalPaidRevenue: 0,
        totalPaidOrders: 0,
        totalOrders: 0,
        averagePerOrder: 0,
      },
    };
  }

  const orderIds = [...new Set(sellerItems.map((i) => i.order_id))];

  const orderRows = await db
    .select({
      id: orders.id,
      xendit_invoice_id: orders.xendit_invoice_id,
      status: orders.status,
      created_at: orders.created_at,
      paid_at: orders.paid_at,
      buyer_name: users.username,
    })
    .from(orders)
    .leftJoin(users, eq(orders.user_id, users.id))
    .where(and(...[eq(orders.status, "paid")])) // Only paid orders
    .orderBy(desc(orders.created_at));

  // Filter orders that have our items
  const matchedOrders = orderRows.filter((o) => orderIds.includes(o.id));

  const resultItems: SalesReportItem[] = matchedOrders.map((order) => {
    const items = sellerItems.filter((i) => i.order_id === order.id);
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const shippingCost = items.reduce((sum, i) => sum + i.shipping_cost, 0);

    return {
      order_id: order.id,
      xendit_invoice_id: order.xendit_invoice_id,
      buyer_name: order.buyer_name,
      status: order.status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      shipping_cost: shippingCost,
      total: subtotal + shippingCost,
      items: items.map((i) => ({
        id: i.id,
        product_title: i.product_title,
        product_price: i.product_price,
        quantity: i.quantity,
        product_weight_unit: i.product_weight_unit,
        subtotal: i.subtotal,
      })),
    };
  });

  const totalPaidRevenue = resultItems.reduce((sum, i) => sum + i.total, 0);
  const totalPaidOrders = resultItems.length;

  return {
    items: resultItems,
    summary: {
      totalPaidRevenue,
      totalPaidOrders,
      totalOrders: orderIds.length,
      averagePerOrder:
        totalPaidOrders > 0
          ? Math.round(totalPaidRevenue / totalPaidOrders)
          : 0,
    },
  };
}
