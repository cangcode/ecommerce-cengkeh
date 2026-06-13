import { z } from "zod";

export const createSellerProfileSchema = z.object({
  business_name: z.string().min(1),
  business_address: z.string().min(1),
  description: z.string().min(1),
  district_id: z.string().min(1),
  village_id: z.string().min(1),
});

export type CreateSellerProfileInput = z.infer<
  typeof createSellerProfileSchema
>;
