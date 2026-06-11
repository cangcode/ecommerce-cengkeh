import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, Step1Fields, FormData } from "./registerType";

type Props = {
  defaultValues: Partial<FormData>;
  onNext: (data: Step1Fields) => void;
};

export default function Step1({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Fields>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="flex flex-col justify-between gap-4 h-100"
    >
      <div className="space-y-2">
        <div>
          <label className="block text-sm text-cengkeh-brown mb-1">
            Username
          </label>
          <input
            {...register("username")}
            placeholder="Masukkan Username ..."
            className="w-full px-3 py-2 rounded-sm border bg-white/40 border-cengkeh-brown/10 shadow-sm"
          />
          {errors.username && (
            <p className="text-xs text-red-500 mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-cengkeh-brown mb-1">Email</label>
          <input
            {...register("email")}
            placeholder="Masukkan Email ..."
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
            {...register("password")}
            placeholder="Masukkan Password ..."
            type="password"
            className="w-full px-3 py-2 rounded-sm border bg-white/40 border-cengkeh-brown/10 shadow-sm"
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="h-10 px-3 bg-cengkeh-brown text-cengkeh-beige rounded-sm"
        >
          Lanjut →
        </button>
      </div>
    </form>
  );
}
