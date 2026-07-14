import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { confirmDelivery } from "@/db/data/orders/orders.actions";

/** Pembeli konfirmasi barang sudah sampai → set status "selesai" */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Harap login terlebih dahulu." },
      { status: 401 },
    );
  }

  try {
    const { item_id } = await params;
    const itemId = Number(item_id);

    const updated = await confirmDelivery(itemId);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Item tidak ditemukan atau bukan dalam status dikirim.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [CONFIRM DELIVERY] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal konfirmasi: ${msg}` },
      { status: 500 },
    );
  }
}
