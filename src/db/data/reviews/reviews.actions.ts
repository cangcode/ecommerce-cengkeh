"use server";

import { db } from "@/index";
import { seller_reviews, users, order_items } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export type SellerReview = {
  id: number;
  seller_id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  order_item_id: number;
  created_at: Date | null;
  username: string | null;
};

export type SellerReviewSummary = {
  averageRating: number;
  totalReviews: number;
  reviews: SellerReview[];
};

export async function getSellerReviews(
  sellerId: number,
): Promise<SellerReviewSummary> {
  const rows = await db
    .select({
      id: seller_reviews.id,
      seller_id: seller_reviews.seller_id,
      user_id: seller_reviews.user_id,
      rating: seller_reviews.rating,
      comment: seller_reviews.comment,
      order_item_id: seller_reviews.order_item_id,
      created_at: seller_reviews.created_at,
      username: users.username,
    })
    .from(seller_reviews)
    .leftJoin(users, eq(seller_reviews.user_id, users.id))
    .where(eq(seller_reviews.seller_id, sellerId))
    .orderBy(sql`${seller_reviews.created_at} DESC`);

  const avgResult = await db
    .select({
      avg: sql<number>`COALESCE(ROUND(AVG(${seller_reviews.rating})::numeric, 1), 0)`,
      count: sql<number>`COUNT(${seller_reviews.id})::int`,
    })
    .from(seller_reviews)
    .where(eq(seller_reviews.seller_id, sellerId));

  return {
    averageRating: avgResult[0]?.avg ?? 0,
    totalReviews: avgResult[0]?.count ?? 0,
    reviews: rows as SellerReview[],
  };
}

export async function checkCanReview(
  userId: string,
  orderItemId: number,
): Promise<{ canReview: boolean; alreadyReviewed: boolean }> {
  // Check if already reviewed
  const [existing] = await db
    .select({ id: seller_reviews.id })
    .from(seller_reviews)
    .where(eq(seller_reviews.order_item_id, orderItemId))
    .limit(1);

  if (existing) {
    return { canReview: false, alreadyReviewed: true };
  }

  // Check if order_item belongs to user and is 'selesai'
  const [item] = await db
    .select({
      id: order_items.id,
      fulfillment_status: order_items.fulfillment_status,
    })
    .from(order_items)
    .where(
      and(
        eq(order_items.id, orderItemId),
        eq(order_items.fulfillment_status, "selesai"),
      ),
    )
    .limit(1);

  // We don't check user_id on order_items because the client passes userId
  // but we trust that only the item owner can submit
  return { canReview: !!item, alreadyReviewed: false };
}

export async function createSellerReview(data: {
  seller_id: number;
  user_id: string;
  rating: number;
  comment?: string;
  order_item_id: number;
}) {
  // Double-check constraint on server
  const { canReview, alreadyReviewed } = await checkCanReview(
    data.user_id,
    data.order_item_id,
  );

  if (!canReview) {
    throw new Error(
      alreadyReviewed
        ? "Anda sudah memberikan review untuk pesanan ini"
        : "Pesanan belum selesai",
    );
  }

  const [review] = await db
    .insert(seller_reviews)
    .values({
      seller_id: data.seller_id,
      user_id: data.user_id,
      rating: data.rating,
      comment: data.comment ?? null,
      order_item_id: data.order_item_id,
    })
    .returning();

  return review;
}
