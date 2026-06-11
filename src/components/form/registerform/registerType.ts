import { z } from "zod";

export const step1Schema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  email: z.email("Format email tidak valid"),
  password: z
    .string()
    .min(8, { message: "Password minimal harus 8 karakter" })
    .max(32, { message: "Password maksimal 32 karakter" })
    // 1. Memastikan ada minimal satu huruf besar
    .regex(/[A-Z]/, {
      message: "Password harus mengandung minimal satu huruf besar (A-Z)",
    })
    // 2. Memastikan ada minimal satu huruf kecil
    .regex(/[a-z]/, {
      message: "Password harus mengandung minimal satu huruf kecil (a-z)",
    })
    // 3. Memastikan ada minimal satu angka
    .regex(/[0-9]/, {
      message: "Password harus mengandung minimal satu angka (0-9)",
    })
    // 4. Memastikan ada karakter spesial / simbol (opsional, tapi sangat disarankan)
    .regex(/[^A-Za-z0-9]/, {
      message:
        "Password harus mengandung minimal satu simbol atau karakter spesial (@, $, !, %, dsb)",
    }),
});

export const step2Schema = z.object({
  role: z.enum(["pembeli", "penjual"], {
    message: "Pilih jenis akun: Pembeli atau Penjual",
  }),
});

// Gabungkan semua schema untuk final submit
export const formSchema = step1Schema.merge(step2Schema);

// Infer types langsung dari schema — tidak perlu tulis type manual lagi
export type Step1Fields = z.infer<typeof step1Schema>;
export type Step2Fields = z.infer<typeof step2Schema>;
export type FormData = z.infer<typeof formSchema>;
