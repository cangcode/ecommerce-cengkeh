import { Leaf, BadgeCheck, HandCoins, MapPin } from "lucide-react";

const perks = [
  {
    icon: Leaf,
    title: "Langsung dari Petani",
    desc: "Semua cengkeh dipanen dan dijual langsung oleh petani lokal Kabupaten Enrekang, tanpa perantara.",
  },
  {
    icon: BadgeCheck,
    title: "Kualitas Terjamin",
    desc: "Setiap produk melewati proses sortir ketat untuk memastikan cengkeh yang sampai ke tangan Anda berkualitas terbaik.",
  },
  {
    icon: HandCoins,
    title: "Harga Bersaing",
    desc: "Nikmati harga satuan dan grosir yang kompetitif. Semakin banyak beli, semakin hemat!",
  },
  {
    icon: MapPin,
    title: "Jangkauan Enrekang",
    desc: "Melayani pengiriman ke seluruh kecamatan di Kabupaten Enrekang. Bisa diantar atau ambil sendiri.",
  },
];

const WhyUs = () => {
  return (
    <section className="w-full px-6 py-20 xl:px-70">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-cengkeh-brown bg-cengkeh-beige/50 rounded-full border border-cengkeh-brown/10">
          💪 Keunggulan Kami
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-cengkeh-brown">
          Kenapa Beli di{" "}
          <span className="text-cengkeh-darker-brown">Cengkeh Enrekang?</span>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {perks.map((perk, index) => (
          <div
            key={index}
            className="flex gap-5 p-6 rounded-2xl border border-cengkeh-brown/10 bg-white hover:border-cengkeh-brown/20 hover:shadow-sm transition-all"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cengkeh-beige/30 text-cengkeh-brown">
              <perk.icon className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-cengkeh-brown mb-1">
                {perk.title}
              </h3>
              <p className="text-sm text-cengkeh-brown/60 leading-relaxed">
                {perk.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyUs;
