"use server";

import { db } from "@/index";
import { testimonials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type TestimonialRow = {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
  is_active: boolean;
  created_at: Date;
};

export async function getActiveTestimonials(): Promise<TestimonialRow[]> {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.is_active, true))
    .orderBy(desc(testimonials.created_at));
}

export async function getAllTestimonials(): Promise<TestimonialRow[]> {
  return db.select().from(testimonials).orderBy(desc(testimonials.created_at));
}

export async function createTestimonial(data: {
  name: string;
  role: string;
  quote: string;
  rating: number;
}) {
  const [result] = await db.insert(testimonials).values(data).returning();
  return result ?? null;
}

export async function updateTestimonial(
  id: number,
  data: { name?: string; role?: string; quote?: string; rating?: number },
) {
  const [updated] = await db
    .update(testimonials)
    .set(data)
    .where(eq(testimonials.id, id))
    .returning();
  return updated ?? null;
}

export async function toggleTestimonial(id: number) {
  const [current] = await db
    .select({ is_active: testimonials.is_active })
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1);
  if (!current) return null;

  const [updated] = await db
    .update(testimonials)
    .set({ is_active: !current.is_active })
    .where(eq(testimonials.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteTestimonial(id: number) {
  const [deleted] = await db
    .delete(testimonials)
    .where(eq(testimonials.id, id))
    .returning({ id: testimonials.id });
  return deleted ?? null;
}
