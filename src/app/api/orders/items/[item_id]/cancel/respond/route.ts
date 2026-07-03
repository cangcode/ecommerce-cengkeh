import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { respondCancelItem } from "@/db/data/orders/orders.actions";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["approved", "rejected"]),
});

/** PATCH — Penjual menyetujui / menolak pembatalan */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.seller_id) {
    return NextResponse.json(
      {
        success: false,
        message: "Hanya penjual yang bisa menanggapi pembatalan.",
      },
      { status: 403 },
    );
  }

  try {
    const { item_id } = await params;
    const body = await req.json();
    const { action } = respondSchema.parse(body);

    const updated = await respondCancelItem(
      Number(item_id),
      session.user.seller_id,
      action,
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Pembatalan tidak ditemukan atau sudah ditanggapi.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [RESPOND CANCEL] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal menanggapi pembatalan: ${msg}` },
      { status: 500 },
    );
  }
}
