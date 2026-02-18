"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import UnifiedBookingForm from "@/components/booking/UnifiedBookingForm";
import Container from "@/components/ui/Container";
import { Vehicle } from "@/types";

export default function VehicleDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch("/api/vehicles");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Vehicle[];
        setVehicles(data);
      } catch (error) {
        console.error(error);
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
        <Container>
          <p className="text-sm text-slate-600">Loading...</p>
        </Container>
      </section>
    );
  }

  if (!vehicle) {
    return (
      <section className="py-12">
        <Container>
          <p className="text-sm text-slate-700">Vehicle not found</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Container className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          {vehicle.images.map((image, index) => (
            <Image
              key={image}
              src={image}
              alt={`${vehicle.name} image ${index + 1}`}
              width={600}
              height={400}
              className="h-auto w-full rounded-xl object-cover"
            />
          ))}
        </div>

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
