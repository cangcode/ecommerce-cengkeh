import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requestCancelItem } from "@/db/data/orders/orders.actions";
import { z } from "zod";

const requestSchema = z.object({
  reason: z.string().min(5, "Alasan pembatalan minimal 5 karakter"),
});

/** POST — Pembeli mengajukan pembatalan */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ item_id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Kamu harus login." },
      { status: 401 },
    );
  }

  try {
    const { item_id } = await params;
    const body = await req.json();
    const { reason } = requestSchema.parse(body);

    const updated = await requestCancelItem(Number(item_id), reason);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pembatalan tidak dapat diajukan. Pastikan item masih dalam status menunggu.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [REQUEST CANCEL] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal mengajukan pembatalan: ${msg}` },
      { status: 500 },
    );
  }
}
