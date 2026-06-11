CREATE TYPE "public"."user_role" AS ENUM('admin', 'pembeli', 'penjual');--> statement-breakpoint
CREATE TYPE "public"."weight_unit" AS ENUM('gram', 'kg');--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"seller_id" bigint NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" bigint NOT NULL,
	"wholesale_price" bigint,
	"min_wholesale_qty" bigint,
	"weight_unit" "weight_unit" NOT NULL,
	"stock" bigint NOT NULL,
	"image_url" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar(60) NOT NULL,
	"avatar_url" varchar,
	"email_verified_at" timestamp with time zone,
	"role" "user_role" DEFAULT 'pembeli' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"address_id" bigint,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
