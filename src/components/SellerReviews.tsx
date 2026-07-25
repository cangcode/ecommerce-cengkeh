"use client";

import { useEffect, useState } from "react";
import { Star, User, MessageSquare } from "lucide-react";
import {
  getSellerReviews,
  type SellerReview,
} from "@/db/data/reviews/reviews.actions";

type Props = {
  sellerId: number;
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${star <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

export function SellerReviews({ sellerId }: Props) {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await getSellerReviews(sellerId);
        setReviews(data.reviews);
        setAvgRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <p className="text-sm text-muted-foreground">Memuat ulasan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cengkeh-brown/5 border border-cengkeh-brown/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-cengkeh-brown">{avgRating}</p>
            <StarRating rating={Math.round(avgRating)} size={12} />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalReviews} ulasan
            </p>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 text-right text-muted-foreground">
                    {star}
                  </span>
                  <Star className="size-3 fill-amber-500 text-amber-500" />
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No reviews yet */}
      {totalReviews === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Belum ada ulasan untuk toko ini.
        </p>
      )}

      {/* Review List */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-cengkeh-brown flex items-center gap-1.5">
            <MessageSquare className="size-4" />
            Ulasan Pembeli
          </h3>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-3 rounded-lg bg-white border border-cengkeh-brown/10"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-cengkeh-brown/10">
                    <User className="size-3.5 text-cengkeh-brown" />
                  </div>
                  <span className="text-xs font-medium text-cengkeh-brown">
                    {review.username ?? "Pembeli"}
                  </span>
                </div>
                <StarRating rating={review.rating} size={12} />
              </div>
              {review.comment && (
                <p className="text-xs text-muted-foreground ml-9">
                  {review.comment}
                </p>
              )}
              {review.created_at && (
                <p className="text-[10px] text-muted-foreground/60 ml-9 mt-1">
                  {new Date(review.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
