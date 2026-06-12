import { NextResponse } from "next/server";
import { registerUser } from "@/db/data/users/users.actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await registerUser(body);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server. Coba beberapa saat lagi.",
      },
      { status: 500 },
    );
  }
}
