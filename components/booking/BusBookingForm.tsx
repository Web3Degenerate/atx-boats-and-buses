"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DatePicker from "@/components/booking/DatePicker";
import TimeSlotGrid from "@/components/booking/TimeSlotGrid";
import { TimeSlot, Vehicle } from "@/types";

type BusBookingFormProps = {
  vehicle: Vehicle;
};

type AvailabilityResponse = {
  vehicleId: string;
  date: string;
  isBlocked: boolean;
  slots: TimeSlot[];
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function differenceHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function buildBusSlots(date: string, apiSlots: TimeSlot[], isBlocked: boolean): TimeSlot[] {
  const map = new Map(apiSlots.map((slot) => [slot.startTime, slot]));
  const slots: TimeSlot[] = [];

  for (let hour = 9; hour <= 23; hour += 1) {
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const existing = map.get(startTime);

    slots.push({
      date,
      startTime,
      endTime: existing?.endTime || startTime,
      isAvailable: isBlocked ? false : (existing?.isAvailable ?? true)
    });
  }

  return slots;
}

export default function BusBookingForm({ vehicle }: BusBookingFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("");

  const [guestCount, setGuestCount] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [pickupSlots, setPickupSlots] = useState<TimeSlot[]>([]);
  const [returnSlots, setReturnSlots] = useState<TimeSlot[]>([]);
  const [loadingPickupSlots, setLoadingPickupSlots] = useState(false);
  const [loadingReturnSlots, setLoadingReturnSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!startDate) {
      setPickupSlots([]);
      return;
    }

    async function fetchPickupAvailability() {
      const pickupDate = startDate;
      if (!pickupDate) {
        return;
      }

      setLoadingPickupSlots(true);
      setAvailabilityError("");
      setStartTime("");
      setEndDate(undefined);
      setEndTime("");
      setReturnSlots([]);

      const date = formatDate(pickupDate);

      try {
        const response = await fetch(`/api/availability?vehicleId=${vehicle.id}&date=${date}`);

        if (!response.ok) {
          throw new Error("Failed to fetch pickup availability");
        }

        const data = (await response.json()) as AvailabilityResponse;
        setPickupSlots(buildBusSlots(date, data.slots, data.isBlocked));
      } catch (error) {
        console.error(error);
        setAvailabilityError("Unable to load availability. Please try again.");
        setPickupSlots([]);
      } finally {
        setLoadingPickupSlots(false);
      }
    }

    fetchPickupAvailability();
  }, [startDate, vehicle.id]);

  useEffect(() => {
    if (!endDate || !startDate || !startTime) {
      setReturnSlots([]);
      setEndTime("");
      return;
    }

    async function fetchReturnAvailability() {
      const selectedEndDate = endDate;
      if (!selectedEndDate) {
        return;
      }

      setLoadingReturnSlots(true);
      setAvailabilityError("");
      setEndTime("");

      const date = formatDate(selectedEndDate);

      try {
        const response = await fetch(`/api/availability?vehicleId=${vehicle.id}&date=${date}`);

        if (!response.ok) {
          throw new Error("Failed to fetch return availability");
        }

        const data = (await response.json()) as AvailabilityResponse;
        setReturnSlots(buildBusSlots(date, data.slots, data.isBlocked));
      } catch (error) {
        console.error(error);
        setAvailabilityError("Unable to load availability. Please try again.");
        setReturnSlots([]);
      } finally {
        setLoadingReturnSlots(false);
      }
    }

    fetchReturnAvailability();
  }, [endDate, startDate, startTime, vehicle.id]);

  const startDateStr = startDate ? formatDate(startDate) : "";
  const endDateStr = endDate ? formatDate(endDate) : "";

  const filteredReturnSlots = useMemo(() => {
    if (!startDateStr || !startTime || !endDateStr) {
      return returnSlots;
    }

    const startDateTime = toDateTime(startDateStr, startTime);

    return returnSlots.filter((slot) => {
      if (!slot.isAvailable) {
        return false;
      }

      if (endDateStr === startDateStr && toMinutes(slot.startTime) <= toMinutes(startTime)) {
        return false;
      }

      const endDateTime = toDateTime(endDateStr, slot.startTime);
      const hours = differenceHours(startDateTime, endDateTime);

      return hours >= vehicle.minimumHours && hours <= vehicle.maximumHours;
    });
  }, [returnSlots, startDateStr, startTime, endDateStr, vehicle.minimumHours, vehicle.maximumHours]);

  const disabledReturnDates = useMemo(() => {
    if (!startDate || !startTime) {
      return [] as Date[];
    }

    const disabled: Date[] = [];
    const today = new Date();
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const maxDateTime = new Date(toDateTime(formatDate(startDate), startTime).getTime() + vehicle.maximumHours * 60 * 60 * 1000);

    for (let i = 0; i <= 120; i += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dateDay < startDay) {
        disabled.push(dateDay);
        continue;
      }

      const endOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      if (endOfDate < startDay || new Date(date.getFullYear(), date.getMonth(), date.getDate()) > new Date(maxDateTime.getFullYear(), maxDateTime.getMonth(), maxDateTime.getDate())) {
        disabled.push(dateDay);
      }
    }

    return disabled;
  }, [startDate, startTime, vehicle.maximumHours]);

  const selectedHours = useMemo(() => {
    if (!startDateStr || !startTime || !endDateStr || !endTime) {
      return 0;
    }

    const start = toDateTime(startDateStr, startTime);
    const end = toDateTime(endDateStr, endTime);
    return differenceHours(start, end);
  }, [startDateStr, startTime, endDateStr, endTime]);

  const basePrice = selectedHours * vehicle.pricePerHour;
  const fuelCharge = basePrice * (vehicle.fuelChargePercent / 100);
  const totalPrice = basePrice + fuelCharge;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!customerName || !customerEmail || !customerPhone || !startDateStr || !startTime || !endDateStr || !endTime) {
      setSubmitError("Please fill all required fields and select pickup/return date and time.");
      return;
    }

    if (selectedHours < vehicle.minimumHours) {
      setSubmitError(`Minimum booking is ${vehicle.minimumHours} hours.`);
      return;
    }

    if (selectedHours > vehicle.maximumHours) {
      setSubmitError(`Maximum booking is ${vehicle.maximumHours} hours.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          date: startDateStr,
          startTime,
          endTime,
          endDate: endDateStr,
          guestCount,
          customerName,
          customerEmail,
          customerPhone,
          notes
        })
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setSubmitError(data.error || "Unable to start checkout. Please try again.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setSubmitError("Unable to start checkout. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6 rounded-xl border border-slate-200 bg-slate-50 p-5" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-bold text-primary">Book This Vehicle</h2>
        <p className="mt-1 text-sm text-slate-600">
          Minimum booking: {vehicle.minimumHours} hours · Maximum: {vehicle.maximumHours} hours
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">Select Pickup Date</h3>
          <DatePicker selectedDate={startDate} onDateSelect={setStartDate} disabledDates={[]} />
        </div>
        <div>
          {loadingPickupSlots ? (
            <p className="text-sm text-slate-600">Loading pickup times...</p>
          ) : (
            startDate && (
              <TimeSlotGrid
                slots={pickupSlots}
                selectedTime={startTime}
                onTimeSelect={setStartTime}
                label="Select Pickup Time"
              />
            )
          )}
        </div>
      </div>

      {startDate && startTime && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">Select Return Date</h3>
            <DatePicker selectedDate={endDate} onDateSelect={setEndDate} disabledDates={disabledReturnDates} />
          </div>
          <div>
            {loadingReturnSlots ? (
              <p className="text-sm text-slate-600">Loading return times...</p>
            ) : (
              endDate && (
                <TimeSlotGrid
                  slots={filteredReturnSlots}
                  selectedTime={endTime}
                  onTimeSelect={setEndTime}
                  label="Select Return Time"
                />
              )
            )}
          </div>
        </div>
      )}

      {availabilityError && <p className="text-sm text-red-600">{availabilityError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input
            type="tel"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Guest Count</span>
          <input
            type="number"
            min={1}
            max={vehicle.capacity}
            value={guestCount}
            onChange={(event) => setGuestCount(Number(event.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Notes</span>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder={`Enter any special requests or requests for a longer rental than the current ${vehicle.maximumHours} hour maximum...`}
        />
      </label>

      <div className="rounded-lg bg-white p-4">
        <h3 className="text-lg font-semibold text-primary">Price Summary</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p>Hours: {selectedHours || 0}</p>
          <p>Base: ${basePrice.toFixed(2)}</p>
          {vehicle.fuelChargePercent > 0 && <p>Fuel Charge: ${fuelCharge.toFixed(2)}</p>}
          <p className="pt-1 text-base font-semibold text-slate-900">Total: ${totalPrice.toFixed(2)}</p>
        </div>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Processing..." : "Proceed to Payment"}
      </button>
    </form>
  );
}
