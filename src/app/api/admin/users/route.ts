import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAllUsers,
  updateUserRole,
  toggleBanUser,
  resetUserPassword,
} from "@/db/data/users/users.actions";
import { z } from "zod";

/** GET — Admin lihat semua user */
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const data = await getAllUsers(search);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

const updateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "pembeli", "penjual"]),
});

/** PATCH — Admin update role user */
export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { userId, role } = updateSchema.parse(body);

    const updated = await updateUserRole(userId, role);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

const banSchema = z.object({
  userId: z.string().min(1),
});

/** PUT — Admin toggle ban user */
export async function PUT(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { userId } = banSchema.parse(body);

    const updated = await toggleBanUser(userId);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

const resetSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
});

/** POST — Admin reset password user */
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { userId, newPassword } = resetSchema.parse(body);

    const updated = await resetUserPassword(userId, newPassword);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
