import { z } from "zod";

export const createProductSchema = z.object({
  sellerId: z.string(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  wholesalePrice: z.coerce.number().positive().optional(),
  minWholesaleQty: z.coerce.number().int().positive().optional(),
  weightUnit: z.enum(["gram", "kg"]),
  stock: z.coerce.number().int().min(0),
  images: z.array(
    z.object({
      public_id: z.string(),
      secure_url: z.url(),
    }),
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
