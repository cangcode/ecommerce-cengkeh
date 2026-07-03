import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/index";
import { order_items, products } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  fulfillment_status: z.enum([
    "menunggu",
    "diproses",
    "dikirim",
    "selesai",
    "dibatalkan",
  ]),
});

/** Penjual update status pemenuhan pesanan di item miliknya */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Hanya penjual yang bisa mengubah status." },
      { status: 403 },
    );
  }

  try {
    const { item_id } = await params;
    const body = await req.json();
    const { fulfillment_status } = updateSchema.parse(body);
    const itemId = Number(item_id);

    // Ambil status saat ini untuk mencegah pengurangan stok ganda
    const [current] = await db
      .select({
        fulfillment_status: order_items.fulfillment_status,
        product_id: order_items.product_id,
        quantity: order_items.quantity,
      })
      .from(order_items)
      .where(
        and(
          eq(order_items.id, itemId),
          eq(order_items.seller_id, session.user.seller_id),
        ),
      )
      .limit(1);

    if (!current) {
      return NextResponse.json(
        { success: false, message: "Item tidak ditemukan." },
        { status: 404 },
      );
    }

    // Update status
    const [updated] = await db
      .update(order_items)
      .set({ fulfillment_status })
      .where(
        and(
          eq(order_items.id, itemId),
          eq(order_items.seller_id, session.user.seller_id),
        ),
      )
      .returning();

    // Kurangi stok & tambah sold_count / buyer_count saat transisi ke "selesai"
    if (
      fulfillment_status === "selesai" &&
      current.fulfillment_status !== "selesai"
    ) {
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} - ${current.quantity}`,
          sold_count: sql`${products.sold_count} + ${current.quantity}`,
          buyer_count: sql`${products.buyer_count} + 1`,
        })
        .where(eq(products.id, current.product_id));
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [UPDATE FULFILLMENT] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal update status: ${msg}` },
      { status: 500 },
    );
  }
}
