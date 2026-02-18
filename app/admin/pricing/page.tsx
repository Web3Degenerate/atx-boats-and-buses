"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VehiclePricing = {
  id: string;
  name: string;
  slug: string;
  price_per_hour: number;
  minimum_hours: number;
  maximum_hours: number;
  fuel_charge_percent: number;
};

type EditableVehiclePricing = {
  id: string;
  name: string;
  slug: string;
  pricePerHourDollars: string;
  minimumHours: string;
  maximumHours: string;
  fuelChargePercent: string;
  previousFuelChargePercent: string;
};

export default function AdminPricingPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<EditableVehiclePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricing() {
      const token = window.localStorage.getItem("admin_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/pricing", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        window.localStorage.removeItem("admin_token");
        router.replace("/admin/login");
        return;
      }

      const data = (await response.json()) as VehiclePricing[];
      setVehicles(
        data.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          slug: vehicle.slug,
          pricePerHourDollars: (vehicle.price_per_hour / 100).toFixed(2),
          minimumHours: String(vehicle.minimum_hours),
          maximumHours: String(vehicle.maximum_hours),
          fuelChargePercent: String(vehicle.fuel_charge_percent),
          previousFuelChargePercent: vehicle.fuel_charge_percent > 0 ? String(vehicle.fuel_charge_percent) : ""
        }))
      );
      setLoading(false);
    }

    fetchPricing();
  }, [router]);

  function updateVehicle(id: string, key: keyof EditableVehiclePricing, value: string) {
    setVehicles((prev) => prev.map((vehicle) => (vehicle.id === id ? { ...vehicle, [key]: value } : vehicle)));
  }

  function toggleFuelCharge(id: string, enabled: boolean) {
    setVehicles((prev) =>
      prev.map((vehicle) => {
        if (vehicle.id !== id) {
          return vehicle;
        }

        if (!enabled) {
          return {
            ...vehicle,
            previousFuelChargePercent:
              Number(vehicle.fuelChargePercent) > 0 ? vehicle.fuelChargePercent : vehicle.previousFuelChargePercent,
            fuelChargePercent: "0"
          };
        }

        const restoredValue =
          Number(vehicle.previousFuelChargePercent) > 0 ? vehicle.previousFuelChargePercent : "20";

        return {
          ...vehicle,
          fuelChargePercent: restoredValue
        };
      })
    );
  }

  async function saveVehicle(vehicle: EditableVehiclePricing) {
    const token = window.localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    setSavingId(vehicle.id);

    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        pricePerHour: Math.round(Number(vehicle.pricePerHourDollars || 0) * 100),
        minimumHours: Number(vehicle.minimumHours || 0),
        maximumHours: Number(vehicle.maximumHours || 0),
        fuelChargePercent: Number(vehicle.fuelChargePercent || 0)
      })
    });

    if (response.status === 401) {
      window.localStorage.removeItem("admin_token");
      router.replace("/admin/login");
      return;
    }

    setSavingId(null);
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-primary">{vehicle.name}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm text-slate-700">Price/Hour (USD)</span>
              <input
                type="number"
                step="0.01"
                value={vehicle.pricePerHourDollars}
                onChange={(event) => updateVehicle(vehicle.id, "pricePerHourDollars", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-slate-700">Minimum Hours</span>
              <input
                type="number"
                value={vehicle.minimumHours}
                onChange={(event) => updateVehicle(vehicle.id, "minimumHours", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-slate-700">Maximum Hours</span>
              <input
                type="number"
                value={vehicle.maximumHours}
                onChange={(event) => updateVehicle(vehicle.id, "maximumHours", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Number(vehicle.fuelChargePercent) > 0}
                  onChange={(event) => toggleFuelCharge(vehicle.id, event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Fuel Charge Enabled</span>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-slate-700">Fuel Charge %</span>
                <input
                  type="number"
                  value={vehicle.fuelChargePercent}
                  disabled={Number(vehicle.fuelChargePercent) === 0}
                  onChange={(event) => updateVehicle(vehicle.id, "fuelChargePercent", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>
            </div>
          </div>
          <button
            onClick={() => saveVehicle(vehicle)}
            disabled={savingId === vehicle.id}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {savingId === vehicle.id ? "Saving..." : "Save"}
          </button>
        </div>
      ))}
    </div>
  );
}
