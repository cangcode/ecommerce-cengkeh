import { NextResponse } from "next/server";
import {
  deleteItemFromChart,
  updateItemQuantity,
} from "@/db/data/charts/charts.actions";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await updateItemQuantity(Number(id), Number(body.quantity));

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Update Chart Item API Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui item." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await deleteItemFromChart(Number(id));

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Delete Chart Item API Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus item." },
      { status: 500 },
    );
  }
}
