"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PricingVehicle = {
  id: string;
  name: string;
  slug: string;
  price_per_hour: number;
  minimum_hours: number;
  maximum_hours: number;
  fuel_charge_percent: number;
};

type ManualBookingFormProps = {
  onCreated: () => void;
};

type CreatedResult = {
  paymentUrl: string;
  waiverUrl: string;
};

function computeHours(date: string, startTime: string, endDate: string, endTime: string): number {
  if (!date || !startTime || !endDate || !endTime) {
    return 0;
  }

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

function formatHourLabel(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
}

// Hour-block options, midnight through 11 PM — admins can book outside public hours.
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: `${String(hour).padStart(2, "0")}:00`,
  label: formatHourLabel(hour)
}));

function daysUntil(dateStr: string): number | null {
  if (!dateStr) {
    return null;
  }

  const bookingDate = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return Number.isFinite(days) ? days : null;
}

export default function ManualBookingForm({ onCreated }: ManualBookingFormProps) {
  const [vehicles, setVehicles] = useState<PricingVehicle[]>([]);
  const [vehicleSlug, setVehicleSlug] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [amountEdited, setAmountEdited] = useState(false);
  const [depositMode, setDepositMode] = useState<"full" | "deposit">("full");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedResult | null>(null);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const response = await fetch("/api/admin/pricing");

        if (!response.ok) {
          setError("Failed to load vehicles. Refresh the page and try again.");
          return;
        }

        const data = (await response.json()) as PricingVehicle[];
        setVehicles(data);
      } catch (loadError) {
        console.error("Failed to load manual-booking vehicles:", loadError);
        setError("Failed to load vehicles. Check your connection and refresh the page.");
      }
    }

    loadVehicles();
  }, []);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.slug === vehicleSlug);
  const hours = computeHours(date, startTime, endDate, endTime);

  const computedTotalCents = useMemo(() => {
    if (!selectedVehicle || hours <= 0) {
      return 0;
    }

    const baseCents = hours * selectedVehicle.price_per_hour;
    const fuelCents = baseCents * (selectedVehicle.fuel_charge_percent / 100);
    return Math.round(baseCents + fuelCents);
  }, [selectedVehicle, hours]);

  useEffect(() => {
    if (!amountEdited && computedTotalCents > 0) {
      setAmountDollars((computedTotalCents / 100).toFixed(2));
    }
  }, [computedTotalCents, amountEdited]);

  useEffect(() => {
    if (date && !endDate) {
      setEndDate(date);
    }
  }, [date, endDate]);

  const totalAmountCents = Math.round(Number(amountDollars || 0) * 100);
  const collectNowCents = depositMode === "full" ? totalAmountCents : Math.round(totalAmountCents * 0.2);

  // Deposit mode depends on the balance cron charging 2 days before the trip.
  const daysOut = daysUntil(date);
  const depositAllowed = daysOut === null || daysOut > 2;

  useEffect(() => {
    if (!depositAllowed && depositMode === "deposit") {
      setDepositMode("full");
    }
  }, [depositAllowed, depositMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vehicleSlug,
          date,
          startTime,
          endDate,
          endTime,
          guestCount: Number(guestCount),
          customerName,
          customerEmail,
          customerPhone,
          notes,
          totalAmountCents,
          depositMode
        })
      });

      const data = (await response.json()) as { error?: string; paymentUrl?: string; waiverUrl?: string };

      if (!response.ok || !data.paymentUrl || !data.waiverUrl) {
        setError(data.error || "Failed to create booking.");
        return;
      }

      setCreated({ paymentUrl: data.paymentUrl, waiverUrl: data.waiverUrl });
      onCreated();
    } catch {
      setError("Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-slate-900">
        <p className="font-semibold text-emerald-900">
          Booking created. The customer has been emailed the payment link and waiver link.
        </p>
        <div>
          <p className="font-semibold">Payment link (valid 24 hours):</p>
          <p className="break-all text-slate-700">{created.paymentUrl}</p>
        </div>
        <div>
          <p className="font-semibold">Waiver link:</p>
          <p className="break-all text-slate-700">{created.waiverUrl}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreated(null);
            setError("");
          }}
          className="rounded bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-300 bg-white p-4 text-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="font-medium text-slate-700">Vehicle</span>
          <select
            value={vehicleSlug}
            onChange={(event) => {
              setVehicleSlug(event.target.value);
              setAmountEdited(false);
            }}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          >
            <option value="">{vehicles.length === 0 && !error ? "Loading vehicles..." : "Select vehicle"}</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.slug}>
                {vehicle.name} (${(vehicle.price_per_hour / 100).toFixed(0)}/hr)
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Guest Count</span>
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Pickup Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setAmountEdited(false);
            }}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Pickup Time</span>
          <select
            value={startTime}
            onChange={(event) => {
              setStartTime(event.target.value);
              setAmountEdited(false);
            }}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          >
            <option value="">Select pickup time</option>
            {HOUR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Return Date</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setAmountEdited(false);
            }}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Return Time</span>
          <select
            value={endTime}
            onChange={(event) => {
              setEndTime(event.target.value);
              setAmountEdited(false);
            }}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          >
            <option value="">Select return time</option>
            {HOUR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Customer Name</span>
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Customer Email</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">Customer Phone (optional)</span>
          <input
            type="tel"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
        </label>

        <label className="space-y-1">
          <span className="font-medium text-slate-700">
            Total Amount (USD){hours > 0 && selectedVehicle ? ` — ${hours} hr auto-priced` : ""}
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amountDollars}
            onChange={(event) => {
              setAmountDollars(event.target.value);
              setAmountEdited(true);
            }}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="font-medium text-slate-700">Notes (optional)</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
        />
      </label>

      <div className="space-y-2">
        <span className="font-medium text-slate-700">Payment</span>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="radio"
              name="depositMode"
              checked={depositMode === "full"}
              onChange={() => setDepositMode("full")}
            />
            <span>Collect full amount now</span>
          </label>
          <label className={`flex items-center gap-2 text-slate-700 ${!depositAllowed ? "opacity-50" : ""}`}>
            <input
              type="radio"
              name="depositMode"
              checked={depositMode === "deposit"}
              onChange={() => setDepositMode("deposit")}
              disabled={!depositAllowed}
            />
            <span>20% deposit now, balance auto-charged 2 days before trip</span>
          </label>
        </div>
        {!depositAllowed && date && (
          <p className="text-xs text-amber-700">
            This trip is within 2 days, so the full amount must be collected — the deposit option needs time for
            the automatic balance charge to run.
          </p>
        )}
        {totalAmountCents > 0 && (
          <p className="text-slate-600">
            Payment link will collect{" "}
            <span className="font-semibold">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(collectNowCents / 100)}
            </span>{" "}
            now.
          </p>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
      >
        {submitting ? "Creating..." : "Create Booking & Send Links"}
      </button>
    </form>
  );
}
