"use server";

import { products } from "@/db/schema";
import { db } from "@/index";
import { createProductSchema } from "./products.schema";

export async function createProduct(data: unknown) {
  const validated = createProductSchema.parse(data);

  const [product] = await db
    .insert(products)
    .values({
      sellerId: validated.sellerId,
      slug: validated.slug,
      name: validated.name,
      description: validated.description,
      price: validated.price,
      wholesalePrice: validated.wholesalePrice,
      minWholesaleQty: validated.minWholesaleQty,
      weightUnit: validated.weightUnit,
      stock: validated.stock,
      image_url: validated.images,
    })
    .returning();

  return product;
}
