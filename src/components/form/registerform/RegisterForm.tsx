"use client";
import { useState, useEffect } from "react";
import { FormData } from "./registerType";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Review from "./Review";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Gunakan Link Next.js untuk navigasi super cepat
import { cn } from "@/lib/utils";

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // State baru untuk mengontrol hitung mundur dan status sukses registrasi
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Efek untuk menjalankan hitung mundur secara otomatis jika registrasi sukses
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer); // Membersihkan memori timer saat komponen unmount
  }, [countdown, router]);

  const saveStep = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((s) => s + 1);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData as FormData),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitMessage(result.message ?? "Registrasi gagal.");
        return;
      }

      // Jika pendaftaran berhasil
      setSubmitMessage(result.message ?? "Akun berhasil dibuat.");
      setIsSuccess(true);
      setFormData({});
      setCountdown(8); // Mulai hitung mundur dari angka 5 detik
    } catch (error) {
      console.error(error);
      setSubmitMessage("Terjadi kesalahan saat registrasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-150 h-fit font-inter px-6 mt-10">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-cengkeh-brown">
            Daftar Akun
          </h2>
          <span className="text-sm text-cengkeh-brown">
            Langkah {step} dari 3
          </span>
        </div>
        <div className="flex gap-3">
          <div className="h-2 w-full bg-cengkeh-brown rounded"></div>
          <div
            className={cn(
              "h-2 w-full bg-cengkeh-brown/20 rounded",
              step >= 2 && "bg-cengkeh-brown",
            )}
          ></div>
          <div
            className={cn(
              "h-2 w-full bg-cengkeh-brown/20 rounded",
              step == 3 && "bg-cengkeh-brown",
            )}
          ></div>
        </div>
      </div>

      <div className="h-full">
        {step === 1 && <Step1 defaultValues={formData} onNext={saveStep} />}
        {step === 2 && (
          <Step2
            defaultValues={formData}
            onNext={saveStep}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Review
            data={formData as FormData}
            onBack={() => setStep(2)}
            onSubmit={handleFinalSubmit}
            // Kirim status isSubmitting ATAU isSuccess agar tombol terkunci jika sudah berhasil submit
            isSubmitting={isSubmitting || isSuccess}
          />
        )}
      </div>

      {/* Bagian Alert Teks Informasi & Countdown */}
      {submitMessage && (
        <div
          className={`mt-5 p-3.5 rounded text-sm border ${
            isSuccess
              ? "bg-stone-100 border-cengkeh-brown/20 text-stone-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          <p className={isSuccess ? "font-medium" : ""}>{submitMessage}</p>

          {/* Tampilkan hitung mundur interaktif hanya jika status pendaftaran sukses */}
          {isSuccess && countdown !== null && (
            <p className="mt-1.5 text-xs text-stone-500">
              Anda akan dialihkan otomatis dalam{" "}
              <span className="font-bold text-cengkeh-brown tabular-nums">
                {countdown} detik
              </span>{" "}
              atau{" "}
              <Link
                href="/login"
                className="font-semibold text-cengkeh-brown underline underline-offset-2 hover:text-cengkeh-brown/80"
              >
                klik di sini untuk login
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
