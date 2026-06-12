import { z } from "zod";

export const createProductSchema = z.object({
  seller_id: z.string(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  wholesale_price: z.number().positive(),
  wholesale_qty: z.number().int().positive(),
  weight_unit: z.enum(["gram", "kg"]),
  stock: z.number().int().positive(),
  image_url: z.array(
    z.object({
      public_id: z.string().min(1),
      secure_url: z.url(),
    }),
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
