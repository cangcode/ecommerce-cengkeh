"use client";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Inputs = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const result = await signIn("credentials", {
      ...data,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.ok) {
      router.push(result.url ?? "/");
    } else {
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="font-inter">
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          className="rounded"
          id="email"
          type="email"
          {...register("email")}
          placeholder="Masukkan email anda.."
        />
        <FieldDescription>
          {errors.email && <span>This field is required</span>}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          className="rounded"
          id="password"
          type="password"
          {...register("password")}
          placeholder="Masukkan Password.."
        />
      </Field>
      <FieldDescription>
        {errors.password && <span>This field is required</span>}
      </FieldDescription>

      <input
        type="submit"
        className="text-sm font-semibold bg-cengkeh-brown text-cengkeh-beige px-3 py-1 rounded"
      />
    </form>
  );
}
