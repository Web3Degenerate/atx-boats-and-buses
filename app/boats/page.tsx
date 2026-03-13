"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { Vehicle } from "@/types";

export default function BoatsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch("/api/vehicles");
        if (!response.ok) {
          setError("Unable to load vehicles. Please refresh the page.");
          return;
        }

        const data = (await response.json()) as Vehicle[];
        setVehicles(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load vehicles. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, []);

  const boats = vehicles.filter((vehicle) => vehicle.type === "party-boat");

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Our Boat Fleet</h1>
        <p className="text-neutral-400">Set sail on Lake Austin and Lake Travis in style</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-neutral-800" />
          ))}
        </div>
      ) : (
        <>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {boats.map((vehicle) =>
              vehicle.slug === "cruiser-yacht" ? (
                <article
                  key={vehicle.id}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-sm"
                >
                  <div className="relative h-48 w-full bg-neutral-800">
                    <Image
                      src={vehicle.images[0]}
                      alt={vehicle.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col space-y-3 p-5">
                    <h3 className="text-xl font-semibold text-white">Cobalt Boats Coming Soon</h3>
                    <p className="flex-1 text-sm text-neutral-400">
                      Our fleet features Cobalt Boats renowned for their deep-V hull design, ensuring a
                      smooth and stable ride by cutting through waves rather than bouncing over them
                    </p>
                    {/* <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-200">Up to {vehicle.capacity} guests</span>
                      <span className="font-semibold text-emerald-400">${vehicle.pricePerHour}/hr</span>
                    </div> */}
                    <div aria-hidden="true" className="h-6" />
                    <button
                      type="button"
                      className="inline-flex w-full cursor-default items-center justify-center gap-2 rounded-full bg-red-600 px-8 py-4 font-semibold text-white"
                    >
                      Coming Soon
                    </button>
                  </div>
                </article>
              ) : (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}
