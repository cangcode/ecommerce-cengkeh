import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/index";
import { order_items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

    // Update hanya jika order_item milik seller ini
    const [updated] = await db
      .update(order_items)
      .set({ fulfillment_status })
      .where(
        and(
          eq(order_items.id, Number(item_id)),
          eq(order_items.seller_id, session.user.seller_id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Item tidak ditemukan." },
        { status: 404 },
      );
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
