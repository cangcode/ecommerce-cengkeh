import { NextResponse } from "next/server";
import { deleteAddress } from "@/db/data/addresses/addresses.actions";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await deleteAddress(Number(id));

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Delete Address API Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus alamat." },
      { status: 500 },
    );
  }
}
