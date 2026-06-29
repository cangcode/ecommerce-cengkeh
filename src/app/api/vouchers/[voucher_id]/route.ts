import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toggleVoucherStatus, deleteVoucher } from "@/db/data/vouchers/voucher.actions";

/** PATCH — Penjual toggle aktif/nonaktif voucher */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ voucher_id: string }> },
) {
  const session = await auth();
  if (!session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Hanya penjual." },
      { status: 403 },
    );
  }
  try {
    const { voucher_id } = await params;
    const updated = await toggleVoucherStatus(
      Number(voucher_id),
      session.user.seller_id,
    );
    if (!updated) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/** DELETE — Penjual hapus voucher */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ voucher_id: string }> },
) {
  const session = await auth();
  if (!session?.user?.seller_id) {
    return NextResponse.json(
      { success: false, message: "Hanya penjual." },
      { status: 403 },
    );
  }
  try {
    const { voucher_id } = await params;
    const deleted = await deleteVoucher(Number(voucher_id), session.user.seller_id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
