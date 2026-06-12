import z from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  email: z.email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["pembeli", "penjual"]),
});
