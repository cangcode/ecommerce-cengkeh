"use client";

import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
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
      router.push(result.url ?? "/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="font-inter space-y-4">
      {authError && (
        <div className="rounded border p-3 text-sm">{authError}</div>
      )}

      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>

        <Input
          id="email"
          type="email"
          placeholder="Masukkan email anda..."
          {...register("email")}
        />

        <FieldDescription className="text-xs text-red-500">
          {errors.email?.message}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>

        <Input
          id="password"
          type="password"
          placeholder="Masukkan password..."
          {...register("password")}
        />

        <FieldDescription className="text-xs text-red-500">
          {errors.password?.message}
        </FieldDescription>
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-cengkeh-brown px-3 py-1 text-sm font-semibold text-cengkeh-beige disabled:opacity-50"
      >
        {isSubmitting ? "Masuk..." : "Masuk"}
      </button>
    </form>
  );
}
