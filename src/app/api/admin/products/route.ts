import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAllProductsForAdmin,
  toggleProductActive,
  deleteProduct,
  createProductForAdmin,
  updateProductForAdmin,
} from "@/db/data/products/admin-product.actions";
import { createProductSchema } from "@/db/data/products/products.schema";
import { z } from "zod";

function isAdmin(session: any): boolean {
  return !!(session?.user && session.user.role === "admin");
}

/** GET — Admin lihat semua produk */
export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const data = await getAllProductsForAdmin(search);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

/** POST — Admin buat produk baru */
export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const parsed = createProductSchema.parse(body);
    const data = await createProductForAdmin(parsed);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

const updateSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  wholesale_price: z.number().positive().optional().nullable(),
  wholesale_qty: z.number().int().positive().optional().nullable(),
  weight_unit: z.enum(["gram", "kg"]).optional(),
  stock: z.number().int().positive().optional(),
  slug: z.string().min(1).optional(),
  seller_id: z.number().optional(),
  image_url: z
    .array(z.object({ public_id: z.string().min(1), secure_url: z.string() }))
    .optional(),
});

/** PATCH — Admin update produk */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  try {
    const body = await req.json();
    const { id, ...rawFields } = updateSchema.parse(body);
    // Strip nulls -> undefined & build clean payload
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawFields)) {
      if (v !== null) cleaned[k] = v;
    }
    const data = await updateProductForAdmin(id, cleaned as any);
    if (!data)
      return NextResponse.json(
        { success: false, message: "Tidak ditemukan." },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

/** PUT — Admin toggle active produk */
export async function PUT(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  try {
    const { id } = await req.json();
    const data = await toggleProductActive(id);
    if (!data)
      return NextResponse.json(
        { success: false, message: "Tidak ditemukan." },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

/** DELETE — Admin hapus produk */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  try {
    const { id } = await req.json();
    const data = await deleteProduct(id);
    if (!data)
      return NextResponse.json(
        { success: false, message: "Tidak ditemukan." },
        { status: 404 },
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
