import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema, Step2Fields, FormData } from "./registerType";
import { ShoppingCart, Sprout, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  defaultValues: Partial<FormData>;
  onNext: (data: Step2Fields) => void;
  onBack: () => void;
};

export default function Step2({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step2Fields>({
    resolver: zodResolver(step2Schema),
    defaultValues,
  });

  const selectedRole = watch("role");

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="flex flex-col justify-between gap-4 h-100"
    >
      <div>
        <label className="block text-sm text-cengkeh-brown mb-1">
          Jenis Akun
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() =>
              setValue("role", "pembeli", { shouldValidate: true })
            }
            className={`flex-1 py-20 font-semibold flex gap-3 items-center flex-col rounded-sm border text-center transition-colors shadow-sm ${
              selectedRole === "pembeli"
                ? "bg-cengkeh-brown text-cengkeh-beige"
                : "text-cengkeh-brown"
            }`}
          >
            <ShoppingCart className="size-15" />
            Pembeli
            <p className="font-medium text-sm w-50">
              Saya ingin membeli cengkeh untuk kebutuhan saya
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setValue("role", "penjual", { shouldValidate: true })
            }
            className={`flex-1 py-20 font-semibold flex gap-3 items-center flex-col rounded-sm border text-center transition-colors shadow-sm ${
              selectedRole === "penjual"
                ? "bg-cengkeh-brown text-cengkeh-beige"
                : "text-cengkeh-brown"
            }`}
          >
            <Store className="size-15" />
            Penjual
            <p className="font-medium text-sm w-50">
              Saya ingin menjual cengkeh ke pembeli lain
            </p>
          </button>
        </div>
        {errors.role && (
          <p className="text-xs text-red-500 mt-1">{errors.role?.message}</p>
        )}
        {/* hidden input so register tracks the value */}
        <input type="hidden" {...register("role")} />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-10 px-3 border border-cengkeh-brown rounded-sm text-cengkeh-brown"
        >
          ← Kembali
        </button>
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
