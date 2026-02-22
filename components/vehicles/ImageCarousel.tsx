"use client";

import { useState } from "react";

type ImageCarouselProps = {
  images: string[];
  alt: string;
};

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i + 1 >= images.length ? 0 : i + 1));
  const dots = Array.from({ length: images.length });

  return (
    <div className="relative">
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-100">
        <img src={images[index]} alt={`${alt} ${index + 1}`} className="block h-auto w-full" style={{ imageOrientation: "from-image" }} />
      </div>

      <button
        type="button"
        onClick={prev}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
      >
        ›
      </button>

      <div className="mt-3 flex justify-center gap-2">
        {dots.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition ${index === i ? "bg-primary" : "bg-slate-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
