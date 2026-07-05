"use client";

import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setAuthError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      console.log(result);

      switch (result.error) {
        case "CredentialsSignin":
          setAuthError("Email atau password salah.");
          break;

        default:
          setAuthError("Terjadi kesalahan saat login.");
      }

      return;
    }

    if (result?.ok) {
      router.refresh();
      router.push(result.url ?? "/dashboard");
    }
  };

  return (
    <div className="w-150 h-fit font-inter px-6 xl:px-70 mt-10">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-cengkeh-brown">Masuk Akun</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="p-3.5 rounded-sm text-sm border bg-red-50 border-red-200 text-red-600">
            {authError}
          </div>
        )}

        <div>
          <label className="block text-sm text-cengkeh-brown mb-1">Email</label>
          <input
            type="email"
            placeholder="Masukkan email anda..."
            {...register("email")}
            className="w-full px-3 py-2 rounded-sm border bg-white/40 border-cengkeh-brown/10 shadow-sm"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-cengkeh-brown mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="Masukkan password..."
            {...register("password")}
            className="w-full px-3 py-2 rounded-sm border bg-white/40 border-cengkeh-brown/10 shadow-sm"
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/register"
            className="text-sm text-cengkeh-brown underline underline-offset-2 hover:text-cengkeh-brown/80"
          >
            Belum punya akun?
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-3 bg-cengkeh-brown text-cengkeh-beige rounded-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Masuk..." : "Masuk"}
          </button>
        </div>
      </form>
    </div>
  );
}
