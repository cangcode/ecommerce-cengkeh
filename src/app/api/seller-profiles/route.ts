import { NextResponse } from "next/server";
import {
  createSellerProfile,
  updateSellerProfile,
} from "@/db/data/seller-profiles/seller-profiles.action";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createSellerProfile(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Create Seller Profile Error :", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "gagal membuat profil penjual. Pastikan data sudah benar dan coba lagi.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Kamu harus login." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const result = await updateSellerProfile(session.user.id, body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Update Seller Profile Error :", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal memperbarui profil penjual. Pastikan data sudah benar dan coba lagi.",
      },
      { status: 500 },
    );
  }
}
