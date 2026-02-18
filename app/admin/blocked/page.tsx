"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BlockedRow = {
  id: string;
  date: string;
  reason: string | null;
  vehicle_name: string;
  vehicle_id: string;
};

type VehicleOption = {
  id: string;
  name: string;
};

type PricingVehicle = {
  id: string;
  name: string;
};

export default function AdminBlockedDatesPage() {
  const router = useRouter();
  const [items, setItems] = useState<BlockedRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const token = window.localStorage.getItem("admin_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const [blockedResponse, vehiclesResponse] = await Promise.all([
        fetch("/api/admin/blocked", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("/api/admin/pricing", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      if (blockedResponse.status === 401 || vehiclesResponse.status === 401) {
        window.localStorage.removeItem("admin_token");
        router.replace("/admin/login");
        return;
      }

      const blockedData = (await blockedResponse.json()) as BlockedRow[];
      const vehicleData = (await vehiclesResponse.json()) as PricingVehicle[];

      setItems(blockedData);
      setVehicles(vehicleData.map((vehicle) => ({ id: vehicle.id, name: vehicle.name })));
      if (vehicleData.length > 0) {
        setVehicleId(vehicleData[0].id);
      }
      setLoading(false);
    }

    loadData();
  }, [router]);

  async function refreshBlockedDates() {
    const token = window.localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/blocked", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      window.localStorage.removeItem("admin_token");
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as BlockedRow[];
    setItems(data);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    await fetch("/api/admin/blocked", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        vehicleId,
        date,
        reason
      })
    });

    setDate("");
    setReason("");
    await refreshBlockedDates();
  }

  async function handleRemove(id: string) {
    const token = window.localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    await fetch("/api/admin/blocked", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    await refreshBlockedDates();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-primary">Block a Date</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Vehicle</span>
            <select
              value={vehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Reason (optional)</span>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
          Block Date
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Vehicle</th>
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">Reason</th>
              <th className="px-3 py-2 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2">{item.vehicle_name}</td>
                <td className="px-3 py-2">{item.date}</td>
                <td className="px-3 py-2">{item.reason || "-"}</td>
                <td className="px-3 py-2">
                  <button onClick={() => handleRemove(item.id)} className="text-sm font-medium text-red-600 hover:text-red-700">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
