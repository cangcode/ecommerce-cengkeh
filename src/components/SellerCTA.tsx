import Link from "next/link";
import AppButton from "./AppButton";
import { Store } from "lucide-react";

const SellerCTA = () => {
  return (
    <section className="w-full px-6 py-20 xl:px-70">
      <div className="relative overflow-hidden rounded-3xl bg-cengkeh-brown px-8 py-14 md:px-16 md:py-16 text-center">
        {/* Background decorative */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-cengkeh-beige/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-cengkeh-darker-brown/30 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Icon */}
          <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-cengkeh-beige/15 text-cengkeh-beige mb-6">
            <Store className="size-8" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-cengkeh-beige mb-4">
            Punya Cengkeh untuk Dijual?
          </h2>
          <p className="text-base md:text-lg text-cengkeh-beige/70 mb-8 max-w-lg mx-auto leading-relaxed">
            Gabung jadi penjual di platform kami dan jangkau pembeli di seluruh
            Kabupaten Enrekang. Daftar gratis, mudah, dan cepat!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <AppButton className="bg-cengkeh-beige text-cengkeh-brown hover:bg-cengkeh-beige/90 px-8 py-3 text-base font-medium">
                Daftar Jadi Penjual
              </AppButton>
            </Link>
            <Link href="/seller-onboarding">
              <AppButton
                variant="outline"
                className="border-cengkeh-beige/40 text-cengkeh-beige hover:bg-cengkeh-beige/10 px-8 py-3 text-base font-medium"
              >
                Pelajari Selengkapnya
              </AppButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellerCTA;
