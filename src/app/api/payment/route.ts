import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";
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

    // Normalize keys from string to number
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

    // 1. Ambil item keranjang dari DB (akurat)
    let chartItems = await getChartItems(session.user.id);

    // Filter by selected chart_item_ids if provided
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

    // 2. Hitung subtotal per item & total shipping
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

    // 2b. Apply voucher jika ada
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

    // 3. Generate order_id & token Midtrans
    const orderId = `TRX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const midtransItems = orderItemRows.map((item) => ({
      id: `PROD-${item.product_id}`,
      price: item.unit_price,
      quantity: item.quantity,
      name: item.product_title.substring(0, 50),
    }));

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        ...midtransItems,
        ...(totalShipping > 0
          ? [
              {
                id: "SHIPPING",
                price: totalShipping,
                quantity: 1,
                name: "Ongkos Kirim",
              },
            ]
          : []),
        ...(voucherDiscount > 0
          ? [
              {
                id: "VOUCHER",
                price: -voucherDiscount,
                quantity: 1,
                name: "Diskon Voucher",
              },
            ]
          : []),
      ],
      customer_details: {
        first_name: session.user.name ?? "Pembeli",
        email: session.user.email ?? "",
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order-list`,
      },
    };

    console.log(
      "🔵 [PAYMENT] Creating transaction for",
      session.user.email,
      "| gross:",
      grossAmount,
    );
    const transaction = await snap.createTransaction(parameter);
    console.log(
      "🟢 [PAYMENT] Token created:",
      transaction.token?.substring(0, 20),
      "...",
    );

    // 4. Simpan order ke DB
    const [savedOrder] = await db
      .insert(orders)
      .values({
        user_id: session.user.id,
        address_id: addressId,
        midtrans_order_id: orderId,
        snap_token: transaction.token,
        status: "pending",
        gross_amount: grossAmount,
        shipping_total: totalShipping,
      })
      .returning({ id: orders.id });

    // 5. Simpan order_items ke DB
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

    // 6. Increment voucher used_count
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
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [PAYMENT] Error:", msg);
    // Log full error object untuk debug di Vercel
    if (error && typeof error === "object" && "ApiResponse" in error) {
      console.error(
        "❌ [PAYMENT] Midtrans response:",
        JSON.stringify((error as any).ApiResponse),
      );
    }
    return NextResponse.json(
      { success: false, message: `Gagal membuat transaksi: ${msg}` },
      { status: 500 },
    );
  }
}
