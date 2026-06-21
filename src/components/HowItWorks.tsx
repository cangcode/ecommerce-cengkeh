import { UserPlus, ShoppingBag, CreditCard, Truck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Daftar Akun",
    desc: "Buat akun sebagai pembeli dengan mudah dan gratis.",
  },
  {
    icon: ShoppingBag,
    title: "Pilih Produk",
    desc: "Jelajahi dan pilih cengkeh terbaik dari petani Enrekang.",
  },
  {
    icon: CreditCard,
    title: "Bayar Aman",
    desc: "Lakukan pembayaran melalui Midtrans, aman dan terpercaya.",
  },
  {
    icon: Truck,
    title: "Produk Diantar",
    desc: "Pilih diantar atau ambil sendiri, sesuai kebutuhan Anda.",
  },
];

const HowItWorks = () => {
  return (
    <section className="w-full px-6 py-20 xl:px-70 bg-cengkeh-beige/20">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-cengkeh-brown bg-cengkeh-beige/50 rounded-full border border-cengkeh-brown/10">
          📋 Panduan
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-cengkeh-brown">
          Cara Belanja di{" "}
          <span className="text-cengkeh-darker-brown">Cengkeh Enrekang</span>
        </h2>
        <p className="mt-3 text-sm md:text-base text-cengkeh-brown/60 max-w-lg mx-auto">
          Empat langkah mudah untuk mendapatkan cengkeh berkualitas
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div key={index} className="relative text-center group">
            {/* Connector line (desktop only) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-cengkeh-brown/10" />
            )}

            {/* Step number */}
            <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-cengkeh-brown text-cengkeh-beige shadow-md group-hover:scale-110 transition-transform">
              <step.icon className="size-8" />
              <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-cengkeh-darker-brown text-[11px] font-bold text-cengkeh-beige">
                {index + 1}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-cengkeh-brown mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-cengkeh-brown/60 max-w-xs mx-auto">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
