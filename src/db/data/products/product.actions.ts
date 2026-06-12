"use server";

import { products } from "@/db/schema";
import { db } from "@/index";
import { createProductSchema } from "./products.schema";
import z from "zod";

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  const validated = createProductSchema.parse(data);

  const productsData = await db.insert(products).values({
    seller_id: validated.seller_id,
    slug: validated.slug,
    title: validated.title,
    description: validated.description,
    price: validated.price,
    wholesale_price: validated.wholesale_price,
    wholesale_qty: validated.wholesale_qty,
    weight_unit: validated.weight_unit,
    stock: validated.stock,
    image_url: validated.image_url,
  });
  return productsData;
}
