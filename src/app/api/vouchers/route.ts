import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getSellerVouchers,
  createVoucher,
} from "@/db/data/vouchers/voucher.actions";
import { z } from "zod";

const createSchema = z.object({
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .max(20)
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, "Hanya huruf besar, angka, dan strip"),
  discount_type: z.enum(["fixed", "percent", "per_unit"]),
  discount_value: z.coerce.number().min(1, "Minimal 1"),
  max_discount: z.coerce.number().optional(),
  usage_limit: z.coerce.number().min(1).default(1),
  expires_at: z.string().optional(),
});

/** GET — Penjual lihat daftar voucher miliknya */
export async function GET() {
  const session = await auth();
  if (!session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Hanya penjual." },
      { status: 403 },
    );
  }
  try {
    const data = await getSellerVouchers(session.user.seller_id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/** POST — Penjual buat voucher baru */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Hanya penjual." },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const result = await createVoucher(session.user.seller_id, parsed);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
