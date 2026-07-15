import { NextResponse } from "next/server";
import { createXenditInvoice } from "@/lib/xendit";
import { auth } from "@/auth";
import { getChartItems } from "@/db/data/charts/charts.actions";
import { db } from "@/index";
import { orders, order_items, vouchers } from "@/db/schema";
import { applyVoucherCode } from "@/db/data/vouchers/voucher.actions";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

type ShippingPerSeller = Record<
  number,
  { method: "ambil_sendiri" | "antarkan"; cost: number }
>;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Kamu harus login." },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const addressId: number = body.address_id;
    const voucherCode: string | undefined = body.voucher_code;
    const chartItemIds: number[] | undefined = body.chart_item_ids;
    const shippingPerSellerRaw = (body.shipping_per_seller ?? {}) as Record<
      string,
      { method: string; cost: number }
    >;

    const shippingPerSeller: Record<
      number,
      { method: "ambil_sendiri" | "antarkan"; cost: number }
    > = {};
    for (const [key, val] of Object.entries(shippingPerSellerRaw)) {
      shippingPerSeller[Number(key)] = val as {
        method: "ambil_sendiri" | "antarkan";
        cost: number;
      };
    }

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: "Alamat tujuan wajib dipilih." },
        { status: 400 },
      );
    }

    let chartItems = await getChartItems(session.user.id);

    if (chartItemIds && chartItemIds.length > 0) {
      const idSet = new Set(chartItemIds);
      chartItems = chartItems.filter((item) => idSet.has(item.id));
    }

    if (!chartItems.length) {
      return NextResponse.json(
        { success: false, message: "Keranjang kosong." },
        { status: 400 },
      );
    }

    const isWholesale = (item: (typeof chartItems)[number]) =>
      item.product_wholesale_price != null &&
      item.product_wholesale_qty != null &&
      item.product_wholesale_price > 0 &&
      item.product_wholesale_qty > 0 &&
      item.quantity >= item.product_wholesale_qty;

    const orderItemRows = chartItems.map((item) => {
      const up = isWholesale(item)
        ? item.product_wholesale_price!
        : item.product_price;
      const sub = up * item.quantity;
      const shipInfo = shippingPerSeller[item.seller_id] ?? {
        method: "antarkan",
        cost: 0,
      };
      return {
        ...item,
        unit_price: up,
        subtotal: sub,
        shipping_method: shipInfo.method,
        shipping_cost: shipInfo.cost,
      };
    });

    const totalShipping = orderItemRows.reduce(
      (sum, i) => sum + i.shipping_cost,
      0,
    );
    const itemsTotal = orderItemRows.reduce((sum, i) => sum + i.subtotal, 0);
    let grossAmount = itemsTotal + totalShipping;

    let voucherDiscount = 0;
    let appliedVoucherId: number | null = null;
    if (voucherCode) {
      const totalWeightKg = orderItemRows.reduce(
        (sum, i) =>
          sum +
          (i.product_weight_unit === "kg" ? i.quantity : i.quantity / 1000),
        0,
      );
      const voucherResult = await applyVoucherCode(
        voucherCode,
        itemsTotal,
        totalWeightKg,
      );
      if (voucherResult.valid && voucherResult.discount_amount) {
        voucherDiscount = voucherResult.discount_amount;
        appliedVoucherId = voucherResult.voucher!.id;
        grossAmount = Math.max(1, grossAmount - voucherDiscount);
      }
    }

    const xenditItems: {
      name: string;
      quantity: number;
      price: number;
      category?: string;
    }[] = orderItemRows.map((item) => ({
      name: item.product_title.substring(0, 50),
      quantity: item.quantity,
      price: item.unit_price,
      category: item.product_weight_unit,
    }));

    // Add shipping as an item
    if (totalShipping > 0) {
      xenditItems.push({
        name: "Ongkos Kirim",
        quantity: 1,
        price: totalShipping,
      });
    }

    // Add voucher as negative item
    if (voucherDiscount > 0) {
      xenditItems.push({
        name: "Diskon Voucher",
        quantity: 1,
        price: -voucherDiscount,
      });
    }

    const invoice = await createXenditInvoice({
      externalId: `TRX-${Date.now()}`,
      amount: grossAmount,
      payerEmail: session.user.email ?? undefined,
      description: `Pembayaran untuk ${orderItemRows.length} produk`,
      customer: {
        givenNames: session.user.name ?? "Pembeli",
        email: session.user.email ?? undefined,
      },
      items: xenditItems,
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order-list`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/chart`,
      currency: "IDR",
    });

    console.log("🟢 [PAYMENT] Full Xendit response:", JSON.stringify(invoice));
    const invoiceUrl: string =
      (invoice as any).invoice_url ?? (invoice as any).invoiceUrl ?? "";
    const invoiceId: string = ((invoice as any).id ?? "") as string;
    const userId = session.user.id as string;

    const [savedOrder] = await db
      .insert(orders)
      .values({
        user_id: userId,
        address_id: addressId,
        xendit_invoice_id: invoiceId,
        invoice_url: invoiceUrl,
        status: "pending",
        gross_amount: grossAmount,
        shipping_total: totalShipping,
      })
      .returning({ id: orders.id });

    const itemValues = orderItemRows.map((item) => ({
      order_id: savedOrder.id,
      product_id: item.product_id,
      seller_id: item.seller_id,
      product_title: item.product_title,
      product_price: item.unit_price,
      product_weight_unit: item.product_weight_unit,
      quantity: item.quantity,
      subtotal: item.subtotal,
      shipping_method: item.shipping_method,
      shipping_cost: item.shipping_cost,
    }));

    await db.insert(order_items).values(itemValues);

    if (appliedVoucherId) {
      await db
        .update(vouchers)
        .set({
          used_count: sql`${vouchers.used_count} + 1`,
          updated_at: new Date(),
        })
        .where(eq(vouchers.id, appliedVoucherId));
    }

    return NextResponse.json({
      success: true,
      invoice_url: invoiceUrl,
      invoice_id: invoiceId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [PAYMENT] Xendit Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal membuat invoice: ${msg}` },
      { status: 500 },
    );
  }
}
