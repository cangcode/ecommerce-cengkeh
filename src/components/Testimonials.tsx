import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Pak Rahman",
    role: "Pedagang Pasar Enrekang",
    quote:
      "Cengkeh dari sini selalu fresh dan harum. Saya udah langganan dari awal, nggak pernah kecewa!",
    rating: 5,
  },
  {
    name: "Bu Nurhayati",
    role: "Pemilik Usaha Rempah",
    quote:
      "Harga grosirnya sangat membantu usaha saya. Kualitas cengkehnya juga konsisten bagus.",
    rating: 5,
  },
  {
    name: "Pak Supardi",
    role: "Petani & Pembeli",
    quote:
      "Platformnya mudah digunakan, meskipun saya kurang paham teknologi. Transaksinya aman.",
    rating: 4,
  },
];

const Testimonials = () => {
  return (
    <section className="w-full px-6 py-20 xl:px-70 bg-cengkeh-beige/20">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-cengkeh-brown bg-cengkeh-beige/50 rounded-full border border-cengkeh-brown/10">
          💬 Testimoni
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-cengkeh-brown">
          Apa Kata{" "}
          <span className="text-cengkeh-darker-brown">Pelanggan Kami?</span>
        </h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, index) => (
          <div
            key={index}
            className="flex flex-col p-6 rounded-2xl border border-cengkeh-brown/10 bg-white hover:border-cengkeh-brown/20 transition-all"
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${
                    i < t.rating
                      ? "fill-cengkeh-brown text-cengkeh-brown"
                      : "text-cengkeh-brown/20"
                  }`}
                />
              ))}
            </div>

            {/* Quote */}
            <p className="text-sm text-cengkeh-brown/70 leading-relaxed mb-5 flex-1">
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-cengkeh-brown/10">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cengkeh-brown text-cengkeh-beige text-sm font-bold">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-cengkeh-brown">
                  {t.name}
                </p>
                <p className="text-xs text-cengkeh-brown/50">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
