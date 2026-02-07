"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { vehicles } from "@/data/vehicles";
import Image from "next/image";

type SettingsResponse = {
  fuel_charge_enabled?: boolean;
};

export default function HomePage() {
  const [fuelChargeEnabled, setFuelChargeEnabled] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          return;
        }

        const data: SettingsResponse = await response.json();
        setFuelChargeEnabled(data.fuel_charge_enabled !== false);
      } catch (error) {
        console.error(error);
      }
    }

    fetchSettings();
  }, []);

  const orderedVehicles = [
    ...vehicles.filter((vehicle) => vehicle.type === "party-bus"),
    ...vehicles.filter((vehicle) => vehicle.type === "party-boat")
  ];

  return (
    <>
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
              Premium boat and party bus rentals for birthdays, corporate outings, and unforgettable weekends across Austin.
            </p>
            <Button href="#vehicles">Browse Vehicles</Button>
          </div>
        </Container>
      </section>

      <section id="vehicles" className="py-16">
        <Container>
          <div className="mb-8 flex items-end justify-between gap-3">
            <h2 className="text-3xl font-bold text-primary">Featured Vehicles</h2>
            <p className="text-sm text-slate-600">Simple placeholders for now</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {orderedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="space-y-2">
                <VehicleCard vehicle={vehicle} />
                <div className="px-1 text-sm text-slate-700">
                  <span>{vehicle.minimumHours} hour minimum</span>
                  {fuelChargeEnabled && vehicle.fuelChargePercent > 0 && (
                    <span className="ml-3 font-medium text-secondary">
                      + {vehicle.fuelChargePercent}% fuel charge
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
