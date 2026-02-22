"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

type HoveredPanel = "left" | "right" | null;

export default function Test1Page() {
  const [hovered, setHovered] = useState<HoveredPanel>(null);

  const leftWidth = hovered === "left" ? "85%" : hovered === "right" ? "15%" : "50%";
  const rightWidth = hovered === "right" ? "85%" : hovered === "left" ? "15%" : "50%";

  const leftOverlay = hovered === "right" ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 0, 120, 0.5)";
  const rightOverlay = hovered === "left" ? "rgba(0, 0, 0, 0.65)" : "rgba(25, 120, 220, 0.5)";

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-primary py-20 text-white">
          <Container className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-shrink-0">
              <Image
                src="/images/logo-white.png"
                alt="ATX Boats & Buses"
                width={300}
                height={300}
                className="h-auto w-[300px] rounded-full"
                priority
              />
            </div>
            <div className="space-y-6 text-center md:max-w-2xl md:text-left">
              <p className="text-sm font-semibold uppercase tracking-wide text-secondary">Austin Rentals</p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">ATX Boats & Buses</h1>
              <p className="max-w-2xl text-base text-slate-200 md:text-lg">
                Premium boat and party bus rentals for birthdays, corporate outings, and unforgettable weekends across
                Austin.
              </p>
              <Button href="#vehicles">Browse Vehicles</Button>
            </div>
          </Container>
        </section>

        <section id="vehicles" className="relative h-screen w-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500 ease-in-out"
            style={{ width: leftWidth }}
            onMouseEnter={() => setHovered("left")}
            onMouseLeave={() => setHovered(null)}
          >
            <Image
              src="/images/Slider_Images/bus-slider-image-hero.webp"
              alt="Party Buses"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 transition-all duration-500 ease-in-out"
              style={{ backgroundColor: leftOverlay }}
            />

            <div className="absolute left-1/2 top-[20%] z-10 -translate-x-1/2">
              <h2 className="relative text-center text-4xl font-bold text-white md:text-6xl">
                Party Buses
                <span
                  className="absolute -bottom-2 left-0 block h-[3px] bg-white transition-all duration-500 ease-in-out"
                  style={{ width: hovered === "left" ? "100%" : "0%" }}
                />
              </h2>
            </div>

            <div className="absolute bottom-[20%] left-1/2 z-10 -translate-x-1/2">
              <a
                href="/vehicles"
                className="inline-flex items-center justify-center border border-white px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-500 ease-in-out hover:bg-white hover:text-black"
              >
                Rent A Bus
              </a>
            </div>
          </div>

          <div
            className="absolute right-0 top-0 h-full transition-all duration-500 ease-in-out"
            style={{ width: rightWidth }}
            onMouseEnter={() => setHovered("right")}
            onMouseLeave={() => setHovered(null)}
          >
            <Image
              src="/images/Slider_Images/boat-slider-image-hero.webp"
              alt="Luxury Boats"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 transition-all duration-500 ease-in-out"
              style={{ backgroundColor: rightOverlay }}
            />

            <div className="absolute left-1/2 top-[20%] z-10 -translate-x-1/2">
              <h2 className="relative text-center text-4xl font-bold text-white md:text-6xl">
                Luxury Boats
                <span
                  className="absolute -bottom-2 left-0 block h-[3px] bg-white transition-all duration-500 ease-in-out"
                  style={{ width: hovered === "right" ? "100%" : "0%" }}
                />
              </h2>
            </div>

            <div className="absolute bottom-[20%] left-1/2 z-10 -translate-x-1/2">
              <a
                href="/vehicles"
                className="inline-flex items-center justify-center border border-white px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-500 ease-in-out hover:bg-white hover:text-black"
              >
                Rent A Boat
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
