import { FormData } from "./registerType";

type Props = {
  data: FormData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

export default function Review({
  data,
  onBack,
  onSubmit,
  isSubmitting,
}: Props) {
  return (
    <div className="flex flex-col gap-6 justify-between h-100">
      <div className="space-y-3">
        <div className="text-sm font-medium text-stone-600">
          Periksa kembali data Anda sebelum mengirim:
        </div>

        {/* Kontainer Review dengan Style Card yang Lebih Bersih */}
        <div className="p-4 bg-white/40 rounded-md border border-cengkeh-brown/10 shadow-sm divide-y divide-cengkeh-brown/10">
          {/* Baris Nama */}
          <div className="flex justify-between items-center py-2.5">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Nama
            </span>
            <span className="text-sm font-semibold text-cengkeh-brown">
              {data.username}
            </span>
          </div>

          {/* Baris Email */}
          <div className="flex justify-between items-center py-2.5">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Email
            </span>
            <span className="text-sm font-semibold text-cengkeh-brown tabular-nums">
              {data.email}
            </span>
          </div>

          {/* Baris Jenis Akun dengan Badge */}
          <div className="flex justify-between items-center py-2.5">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Jenis Akun
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-cengkeh-brown/10 text-cengkeh-brown capitalize tracking-wide">
              {data.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigasi Tombol dengan Efek Hover */}
      <div className="flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="h-10 px-4 border border-cengkeh-brown rounded-sm text-cengkeh-brown text-sm font-medium hover:bg-cengkeh-brown/5 active:bg-cengkeh-brown/10 transition-colors duration-200"
        >
          ← Kembali
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-10 px-6 bg-cengkeh-brown text-cengkeh-beige rounded-sm text-sm font-semibold shadow-md shadow-cengkeh-brown/10 hover:bg-cengkeh-brown/90 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Mengirim..." : "Submit Data"}
        </button>
      </div>
    </div>
  );
}
