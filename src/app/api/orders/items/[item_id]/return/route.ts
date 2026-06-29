import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requestReturnItem } from "@/db/data/orders/orders.actions";
import { z } from "zod";

const requestSchema = z.object({
  reason: z.string().min(5, "Alasan retur minimal 5 karakter"),
});

/** POST — Pembeli mengajukan retur untuk item tertentu */
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

    const updated = await requestReturnItem(Number(item_id), reason);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Retur tidak dapat diajukan. Pastikan item dikirim & belum diretur.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ [REQUEST RETURN] Error:", msg);
    return NextResponse.json(
      { success: false, message: `Gagal mengajukan retur: ${msg}` },
      { status: 500 },
    );
  }
}
