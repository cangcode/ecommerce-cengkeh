"use client";

import { useState } from "react";
import { Store } from "lucide-react";

type Props = {
  image_url: { public_id: string; secure_url: string }[];
  title: string;
};

export function ProductImageGallery({ image_url, title }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = image_url[activeIndex];

  return (
    <div>
      {/* Gambar utama */}
      {current?.secure_url ? (
        <img
          src={current.secure_url}
          alt={title}
          className="w-full rounded-xl object-cover aspect-square"
        />
      ) : (
        <div className="w-full rounded-xl bg-cengkeh-beige/40 aspect-square flex items-center justify-center">
          <Store className="size-12 text-cengkeh-brown/20" />
        </div>
      )}

      {/* Thumbnail list */}
      {image_url.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {image_url.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`size-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                idx === activeIndex
                  ? "border-cengkeh-brown"
                  : "border-cengkeh-brown/10 hover:border-cengkeh-brown/40"
              }`}
            >
              <img
                src={img.secure_url}
                alt={`${title} ${idx + 1}`}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
