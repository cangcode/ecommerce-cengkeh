import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatRupiah = (value: number | string): string => {
  if (value === undefined || value === null || value === "") return "";

  // Ambil hanya angka saja
  const numberString = value.toString().replace(/[^0-9]/g, "");
  if (!numberString) return "";

  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(numberString));

  // Ganti spasi tipis bawaan Intl dengan spasi biasa biar rapi
  return formatted.replace(/\s/g, " ");
};

// Mengubah format Rupiah kembali menjadi angka murni (Contoh: "Rp 1.000" -> 1000)
export const parseRupiahToNumber = (value: string): number => {
  const cleanValue = value.replace(/[^0-9]/g, "");
  return cleanValue === "" ? 0 : Number(cleanValue);
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase() // 1. Ubah semua huruf menjadi kecil
    .trim() // 2. Buang spasi di awal dan akhir teks
    .replace(/\s+/g, "-") // 3. Ganti semua spasi (termasuk spasi ganda) dengan satu tanda hubung (-)
    .replace(/[^\w\-]+/g, "") // 4. Hapus semua karakter non-alfanumerik (kecuali huruf, angka, dan tanda hubung)
    .replace(/\-\-+/g, "-") // 5. Jika ada tanda hubung ganda (--) akibat tanda baca, satukan menjadi satu (-)
    .replace(/^-+/, "") // 6. Hapus tanda hubung jika ada di paling awal teks
    .replace(/-+$/, ""); // 7. Hapus tanda hubung jika ada di paling akhir teks
};
