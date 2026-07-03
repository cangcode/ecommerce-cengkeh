import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { respondReturnItem } from "@/db/data/orders/orders.actions";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["approved", "rejected"]),
});

/** PATCH — Penjual menyetujui / menolak retur (tanpa refund — refund ditunda) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Hanya penjual yang bisa menanggapi retur." },
      { status: 403 },
    );
  }

  try {
    const { item_id } = await params;
    const body = await req.json();
    const { action } = respondSchema.parse(body);

    const updated = await respondReturnItem(
      Number(item_id),
      session.user.seller_id,
      action,
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Retur tidak ditemukan atau sudah ditanggapi.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [RESPOND RETURN] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal menanggapi retur: ${msg}` },
      { status: 500 },
    );
  }
}
