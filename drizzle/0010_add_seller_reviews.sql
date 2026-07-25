CREATE TABLE "seller_reviews" (
  "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "seller_id" bigint NOT NULL REFERENCES "seller_profiles"("id"),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "comment" text,
  "order_item_id" bigint NOT NULL REFERENCES "order_items"("id"),
  "created_at" timestamp with time zone DEFAULT now(),
  UNIQUE("order_item_id")
);

CREATE INDEX "idx_seller_reviews_seller_id" ON "seller_reviews" ("seller_id");
CREATE INDEX "idx_seller_reviews_order_item_id" ON "seller_reviews" ("order_item_id");