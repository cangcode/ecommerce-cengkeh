import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  toggleTestimonial,
  deleteTestimonial,
} from "@/db/data/testimonials/testimonial.actions";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  quote: z.string().min(10),
  rating: z.coerce.number().min(1).max(5),
});

const updateSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(2).optional(),
  role: z.string().min(2).optional(),
  quote: z.string().min(10).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
});

function isAdmin(session: any): boolean {
  return !!(session?.user && session.user.role === "admin");
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  const data = await getAllTestimonials();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  const body = await req.json();
  const parsed = createSchema.parse(body);
  const data = await createTestimonial(parsed);
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  const body = await req.json();
  const { id, ...fields } = updateSchema.parse(body);
  const data = await updateTestimonial(id, fields);
  if (!data)
    return NextResponse.json(
      { success: false, message: "Tidak ditemukan." },
      { status: 404 },
    );
  return NextResponse.json({ success: true, data });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  const { id } = await req.json();
  const data = await toggleTestimonial(id);
  if (!data)
    return NextResponse.json(
      { success: false, message: "Tidak ditemukan." },
      { status: 404 },
    );
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, message: "Hanya admin." },
      { status: 403 },
    );
  }
  const { id } = await req.json();
  const data = await deleteTestimonial(id);
  if (!data)
    return NextResponse.json(
      { success: false, message: "Tidak ditemukan." },
      { status: 404 },
    );
  return NextResponse.json({ success: true });
}
