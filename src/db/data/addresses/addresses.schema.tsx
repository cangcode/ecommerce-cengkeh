import { z } from "zod";

export const createAddressSchema = z.object({
  recipient_name: z.string().min(1),
  phone: z.string().min(1),
  district_id: z.string().min(1),
  village_id: z.string().min(1),
  address: z.string().min(1),
  is_default: z.boolean(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
