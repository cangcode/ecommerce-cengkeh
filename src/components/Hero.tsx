import Link from "next/link";
import AppButton from "./AppButton";

const Hero = () => {
  return (
    <section className="relative w-full min-h-[calc(100vh-3.75rem)] bg-cengkeh-beige/20 flex flex-col items-center justify-center text-center px-6 py-20 xl:px-70 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 size-64 rounded-full bg-cengkeh-brown/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 size-80 rounded-full bg-cengkeh-beige/30 blur-3xl" />
      </div>

      {/* Badge / tagline */}
      <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-cengkeh-brown bg-cengkeh-beige/50 rounded-full border border-cengkeh-brown/10">
        🌿 Cengkeh Asli Enrekang
      </span>

      {/* Headline */}
      <h1 className="max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold text-cengkeh-brown leading-tight">
        Cengkeh Kualitas Terbaik{" "}
        <span className="text-cengkeh-darker-brown">dari Enrekang</span>
      </h1>

      {/* Subtitle */}
      <p className="max-w-xl mt-6 text-base md:text-lg text-cengkeh-brown/70 leading-relaxed">
        Temukan cengkeh pilihan langsung dari petani di Kabupaten Enrekang
        dengan harga bersaing. Kualitas terjamin, mendukung ekonomi lokal
        Enrekang.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link href="/product">
          <AppButton className="px-8 py-3 text-base font-medium">
            Lihat Produk
          </AppButton>
        </Link>
        <Link href="/register">
          <AppButton
            variant="outline"
            className="px-8 py-3 text-base font-medium"
          >
            Daftar Sekarang
          </AppButton>
        </Link>
      </div>

      {/* Stats / trust indicators */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16">
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-cengkeh-brown">
            500+
          </p>
          <p className="text-sm text-cengkeh-brown/60 mt-1">Petani Enrekang</p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-cengkeh-brown">
            12
          </p>
          <p className="text-sm text-cengkeh-brown/60 mt-1">Kecamatan</p>
        </div>
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-cengkeh-brown">
            100%
          </p>
          <p className="text-sm text-cengkeh-brown/60 mt-1">
            Kualitas Terjamin
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
