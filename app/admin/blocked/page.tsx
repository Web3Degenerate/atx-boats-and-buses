"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BlockedRow = {
  id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
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

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split("T")[0].split("-");
  return `${month}/${day}/${year}`;
}

function formatDisplayTime(value: string): string {
  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString);
  const minute = minuteString ?? "00";
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minute} ${suffix}`;
}

export default function AdminBlockedDatesPage() {
  const router = useRouter();
  const [items, setItems] = useState<BlockedRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
    const value = String(hour).padStart(2, "0") + ":00";
    const label = formatDisplayTime(value);
    return { value, label };
  });

  useEffect(() => {
    async function loadData() {
      const [blockedResponse, vehiclesResponse] = await Promise.all([
        fetch("/api/admin/blocked"),
        fetch("/api/admin/pricing")
      ]);

      if (blockedResponse.status === 401 || vehiclesResponse.status === 401) {
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
    const response = await fetch("/api/admin/blocked");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as BlockedRow[];
    setItems(data);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetch("/api/admin/blocked", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vehicleId,
        startDate,
        startTime,
        endDate,
        endTime,
        reason
      })
    });

    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setReason("");
    await refreshBlockedDates();
  }

  async function handleRemove(id: string) {
    await fetch("/api/admin/blocked", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
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
        <h2 className="text-lg font-semibold text-primary">Block a Date and Time Range</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Vehicle</span>
            <select
              value={vehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Start Time</span>
            <select
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            >
              <option value="">Select time</option>
              {HOUR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">End Time</span>
            <select
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            >
              <option value="">Select time</option>
              {HOUR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 md:col-span-4">
            <span className="text-sm text-slate-700">Reason (optional)</span>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
            />
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
          Block Range
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-900">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Vehicle</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Start Date</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Start Time</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">End Date</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">End Time</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Reason</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2">{item.vehicle_name}</td>
                <td className="px-3 py-2">{formatDisplayDate(item.start_date)}</td>
                <td className="px-3 py-2">{formatDisplayTime(item.start_time)}</td>
                <td className="px-3 py-2">{formatDisplayDate(item.end_date)}</td>
                <td className="px-3 py-2">{formatDisplayTime(item.end_time)}</td>
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
