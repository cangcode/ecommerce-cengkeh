"use client";

import { z } from "zod";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      router.replace("/admin");
    }
  }, [status, session, router]);

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
      callbackUrl: "/admin",
    });

    if (result?.error) {
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
      router.push("/admin");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-cengkeh-brown/50" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 bg-cengkeh-beige/50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex size-14 mx-auto items-center justify-center rounded-full bg-red-100 mb-4">
            <ShieldAlert className="size-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-cengkeh-brown">Admin Panel</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Halaman khusus administrator
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border border-cengkeh-brown/15 bg-white p-6 shadow-sm"
        >
          {authError && (
            <div className="p-3 rounded-md text-sm border bg-red-50 border-red-200 text-red-600">
              {authError}
            </div>
          )}

          {status === "authenticated" && session?.user?.role !== "admin" && (
            <div className="p-3 rounded-md text-sm border bg-amber-50 border-amber-200 text-amber-700">
              Akun ini bukan administrator.
            </div>
          )}

          <div>
            <label className="block text-sm text-cengkeh-brown mb-1">
              Email Admin
            </label>
            <input
              type="email"
              placeholder="admin@email.com"
              {...register("email")}
              className="w-full px-3 py-2 rounded-md border bg-white border-cengkeh-brown/20 shadow-sm text-sm"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-cengkeh-brown mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full px-3 py-2 rounded-md border bg-white border-cengkeh-brown/20 shadow-sm text-sm"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-red-700 py-2.5 text-sm font-medium text-white hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin mx-auto" />
            ) : (
              "Masuk Admin"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
