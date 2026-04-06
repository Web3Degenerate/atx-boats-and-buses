"use client";

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
            {boats.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
