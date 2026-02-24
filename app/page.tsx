"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Anchor, Bus } from "lucide-react";
import * as motion from "motion/react-client";

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900">
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-neutral-950 via-transparent to-neutral-950" />
          <Image
            src="/images/boat-slider-image-default.webp"
            alt="Hero Background"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        <div className="relative z-20 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="mb-6 text-5xl font-bold tracking-tighter md:text-7xl lg:text-8xl">Explore Austin in Style</h1>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <p className="mx-auto mb-10 max-w-2xl text-lg text-neutral-400 md:text-xl">
              Premium boat and bus rentals for unforgettable experiences on the water and the road.
            </p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/buses"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-black transition-colors hover:bg-neutral-200"
            >
              <Bus className="h-5 w-5" />
              Rent a Bus
            </Link>
            <Link
              href="/boats"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent px-8 py-4 font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Anchor className="h-5 w-5" />
              Rent a Boat
            </Link>
          </motion.div>
        </div>
      </section>

      <section id="about" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-12">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <Link
              id="bus"
              href="/buses"
              className="group relative flex aspect-[4/5] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl p-8 lg:aspect-square lg:p-12"
            >
              <div className="absolute inset-0 bg-neutral-900">
                <Image
                  src="/images/bus-slider-image-default.webp"
                  alt="Luxury Bus Rental"
                  fill
                  className="object-cover opacity-60 transition-all duration-700 ease-in-out group-hover:scale-105 group-hover:opacity-50"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-white" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em]">Premium Fleet</span>
                </div>
                <h2 className="mb-4 text-4xl font-bold tracking-tighter lg:text-5xl">Rent a Bus</h2>
                <p className="mb-8 max-w-sm text-neutral-300">
                  Experience luxury group travel with our premium party buses and coaches. Perfect for corporate events,
                  weddings, and city tours.
                </p>
                <span className="inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-neutral-200">
                  <Bus className="h-4 w-4" />
                  Explore Buses
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              id="boat"
              href="/boats"
              className="group relative flex aspect-[4/5] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl p-8 lg:aspect-square lg:p-12"
            >
              <div className="absolute inset-0 bg-neutral-900">
                <Image
                  src="/images/boat-slider-image-default.webp"
                  alt="Luxury Boat Rental"
                  fill
                  className="object-cover opacity-60 transition-all duration-700 ease-in-out group-hover:scale-105 group-hover:opacity-50"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-white" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em]">Lake Austin & Travis</span>
                </div>
                <h2 className="mb-4 text-4xl font-bold tracking-tighter lg:text-5xl">Rent a Boat</h2>
                <p className="mb-8 max-w-sm text-neutral-300">
                  Hit the water in style. From pontoon boats to luxury yachts, we have the perfect vessel for your lake day.
                </p>
                <span className="inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-neutral-200">
                  <Anchor className="h-4 w-4" />
                  View Boats
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
