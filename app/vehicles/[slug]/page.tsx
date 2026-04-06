"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import UnifiedBookingForm from "@/components/booking/UnifiedBookingForm";
import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/vehicles/ImageCarousel";
import ImageCarouselAnimated from "@/components/vehicles/ImageCarouselAnimated";
import { Vehicle } from "@/types";

const PREVOST_IMAGES = [
  "/images/Luxury_Bus_1/Provost_mar_15_2026/1bus-1.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/2bus-2.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/3bus-3.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/4bus-4.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/5bus-5.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/6bus-6.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/7bus-7.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/8bus-8.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/9bus-9.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/10bus-10.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/11bus-11.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/12bus-12.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/13bus-13.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/14bus-14.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/15bus-15.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/16bus-16.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/17bus-17.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/18bus-18.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/19bus-19.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/20bus-20.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/21bus-21.webp",
];

const EXECUTIVE_SHUTTLE_IMAGES = [
  "/images/36-foot-slider-images/36bus-1-card.webp",
  "/images/36-foot-slider-images/36bus-2-card.webp",
  "/images/36-foot-slider-images/IMG_1939-card.webp",
  "/images/36-foot-slider-images/IMG_1942-card.webp",
  "/images/36-foot-slider-images/IMG_1943-card.webp",
  "/images/36-foot-slider-images/IMG_1944-card.webp",
  "/images/36-foot-slider-images/IMG_1945-card.webp",
  "/images/36-foot-slider-images/IMG_1946-card.webp",
  "/images/36-foot-slider-images/IMG_1947-card.webp",
  "/images/36-foot-slider-images/IMG_1948-card.webp",
  "/images/36-foot-slider-images/IMG_1949-card.webp",
  "/images/36-foot-slider-images/IMG_1953-card.webp",
  "/images/36-foot-slider-images/IMG_1954-card.webp",
  "/images/36-foot-slider-images/IMG_1955-card.webp",
  "/images/36-foot-slider-images/IMG_1959-card.webp",
  "/images/36-foot-slider-images/IMG_1960-card.webp",
  "/images/36-foot-slider-images/IMG_1961-card.webp",
  "/images/36-foot-slider-images/IMG_1963-card.webp",
  "/images/36-foot-slider-images/IMG_1964-card.webp",
  "/images/36-foot-slider-images/IMG_1965-card.webp",
  "/images/36-foot-slider-images/IMG_1966-card.webp",
  "/images/36-foot-slider-images/IMG_1967-card.webp",
  "/images/36-foot-slider-images/IMG_1968-card.webp",
];

const COBALT_IMAGES = [
  "/images/cobalt-boat/cobalt1.png",
  "/images/cobalt-boat/cobalt2.jpg",
  "/images/cobalt-boat/cobalt3.jpeg",
  "/images/cobalt-boat/cobalt4.jpeg",
  "/images/cobalt-boat/cobalt5.jpeg",
  "/images/cobalt-boat/cobalt6.jpeg",
  "/images/cobalt-boat/cobalt7.jpeg",
];

export default function VehicleDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch("/api/vehicles");
        if (!response.ok) {
          setError("Unable to load vehicle details. Please refresh the page.");
          return;
        }

        const data = (await response.json()) as Vehicle[];
        setVehicles(data);
      } catch (error) {
        console.error(error);
        setError("Unable to load vehicle details. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, []);

  const vehicle = useMemo(() => vehicles.find((item) => item.slug === slug), [vehicles, slug]);

  if (loading) {
    return (
      <section className="py-12">
        <Container className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-neutral-800" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-8 w-1/2 animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
          </div>
        </Container>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="py-12">
        <Container>
          <p className="text-sm text-red-400">{error || "Vehicle not found."}</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Container className="space-y-8">
        <ImageCarouselAnimated
          images={
            vehicle.slug === "prevost-tour-bus"
              ? PREVOST_IMAGES
              : vehicle.slug === "executive-shuttle"
                ? EXECUTIVE_SHUTTLE_IMAGES
                : vehicle.slug === "cobalt-boat"
                  ? COBALT_IMAGES
                : vehicle.images
          }
          alt={vehicle.name}
        />

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">{vehicle.name}</h1>
          <p className="text-neutral-300">{vehicle.description}</p>
          <p className="text-neutral-200">
            <span className="font-semibold">Capacity:</span> Up to {vehicle.capacity} guests
          </p>
          <p className="text-xl font-semibold text-emerald-400">${vehicle.pricePerHour} / hour</p>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-white">Features</h2>
            <ul className="list-inside list-disc space-y-1 text-neutral-300">
              {vehicle.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <UnifiedBookingForm vehicle={vehicle} />
        </div>
      </Container>
    </section>
  );
}
