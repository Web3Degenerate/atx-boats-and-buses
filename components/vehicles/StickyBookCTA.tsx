"use client";

import { useEffect, useState } from "react";

type StickyBookCTAProps = {
  label: string;
};

export default function StickyBookCTA({ label }: StickyBookCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const form = document.getElementById("booking-form");

    if (!form) {
      return;
    }

    // Show the bar until the booking form is on screen, then get out of the way.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" }
    );

    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-neutral-950/95 px-4 py-3 backdrop-blur md:hidden">
      <button
        type="button"
        onClick={() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
      >
        {label}
      </button>
    </div>
  );
}
