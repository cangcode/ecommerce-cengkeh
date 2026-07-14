import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/index";
import { order_items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { updateProductStatsOnComplete } from "@/db/data/orders/orders.actions";

const updateSchema = z.object({
  fulfillment_status: z.enum([
    "menunggu",
    "diproses",
    "dikirim",
    "selesai",
    "dibatalkan",
  ]),
});

/** Penjual / Admin update status pemenuhan pesanan */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  const isSeller = !!session?.user?.seller_id;
  const isAdmin = session?.user?.role === "admin";

  if (!isSeller && !isAdmin) {
    return NextResponse.json(
      {
        success: false,
        message: "Tidak memiliki akses untuk mengubah status.",
      },
      { status: 403 },
    );
  }

  try {
    const { item_id } = await params;
    const body = await req.json();
    const { fulfillment_status } = updateSchema.parse(body);
    const itemId = Number(item_id);

    // Build where condition: penjual hanya bisa ubah item miliknya, admin bisa ubah semua
    const whereConditions = [eq(order_items.id, itemId)];
    if (isSeller) {
      whereConditions.push(eq(order_items.seller_id, session.user.seller_id!));
    }

    // Update status
    const [updated] = await db
      .update(order_items)
      .set({ fulfillment_status })
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Item tidak ditemukan." },
        { status: 404 },
      );
    }

    // Jika status berubah jadi "selesai", update statistik produk
    if (fulfillment_status === "selesai") {
      await updateProductStatsOnComplete(itemId);
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
