"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import UnifiedBookingForm from "@/components/booking/UnifiedBookingForm";
import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/vehicles/ImageCarousel";
import { Vehicle } from "@/types";

const PREVOST_IMAGES = [
  "/images/Luxury_Bus_1/Provost_gdrive/bus-2-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-3-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-4-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-5-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-8-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-9-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-12-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-13-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-14-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-15-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-16-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-18-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-22-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-23-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-28-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-29-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-32-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-33-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-34-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-35-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-38-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-39-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-42-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-43-card.webp",
  "/images/Luxury_Bus_1/Provost_gdrive/bus-44-card.webp"
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
              <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          </div>
        </Container>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="py-12">
        <Container>
          <p className="text-sm text-red-600">{error || "Vehicle not found."}</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Container className="space-y-8">
        <ImageCarousel images={vehicle.slug === "prevost-tour-bus" ? PREVOST_IMAGES : vehicle.images} alt={vehicle.name} />

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary">{vehicle.name}</h1>
          <p className="text-slate-700">{vehicle.description}</p>
          <p className="text-slate-800">
            <span className="font-semibold">Capacity:</span> Up to {vehicle.capacity} guests
          </p>
          <p className="text-xl font-semibold text-accent">${vehicle.pricePerHour} / hour</p>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-primary">Features</h2>
            <ul className="list-inside list-disc space-y-1 text-slate-700">
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
