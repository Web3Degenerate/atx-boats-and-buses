"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DatePicker from "@/components/booking/DatePicker";
import TimeRangeSelector from "@/components/booking/TimeRangeSelector";
import { TimeSlot, Vehicle } from "@/types";

type BookingFormProps = {
  vehicle: Vehicle;
};

type AvailabilityResponse = {
  vehicleId: string;
  date: string;
  isBlocked: boolean;
  slots: TimeSlot[];
};

type SettingsResponse = {
  fuel_charge_enabled?: boolean;
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function BookingForm({ vehicle }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
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

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setIsBlocked(false);
      setAvailabilityError("");
      return;
    }

    const date = format(selectedDate, "yyyy-MM-dd");

    async function fetchAvailability() {
      setIsLoadingAvailability(true);
      setAvailabilityError("");
      setStartTime("");
      setEndTime("");

      try {
        const response = await fetch(`/api/availability?vehicleId=${vehicle.id}&date=${date}`);

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data: AvailabilityResponse = await response.json();
        setAvailableSlots(data.slots);
        setIsBlocked(data.isBlocked);
      } catch (error) {
        console.error(error);
        setAvailabilityError("Unable to load availability. Please try again.");
        setAvailableSlots([]);
        setIsBlocked(false);
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    fetchAvailability();
  }, [selectedDate, vehicle.id]);

  useEffect(() => {
    if (!startTime) {
      setEndTime("");
      return;
    }

    if (endTime && toMinutes(endTime) <= toMinutes(startTime)) {
      setEndTime("");
    }
  }, [startTime, endTime]);

  const selectedHours = useMemo(() => {
    if (!startTime || !endTime) {
      return 0;
    }

    return (toMinutes(endTime) - toMinutes(startTime)) / 60;
  }, [startTime, endTime]);

  const appliedFuelChargePercent = fuelChargeEnabled ? vehicle.fuelChargePercent : 0;
  const basePrice = selectedHours * vehicle.pricePerHour;
  const fuelCharge = basePrice * (appliedFuelChargePercent / 100);
  const totalPrice = basePrice + fuelCharge;

  return (
    <form className="space-y-6 rounded-xl border border-slate-200 bg-slate-50 p-5" onSubmit={(event) => event.preventDefault()}>
      <div>
        <h2 className="text-2xl font-bold text-primary">Book This Vehicle</h2>
        <p className="mt-1 text-sm text-slate-600">Minimum booking: {vehicle.minimumHours} hours</p>
      </div>

      <DatePicker selectedDate={selectedDate} onDateSelect={setSelectedDate} disabledDates={[]} />

      {selectedDate && (
        <div className="space-y-3">
          {isLoadingAvailability && <p className="text-sm text-slate-600">Loading availability...</p>}
          {availabilityError && <p className="text-sm text-red-600">{availabilityError}</p>}
          {isBlocked && <p className="text-sm text-red-600">This vehicle is not available on the selected date.</p>}

          {!isLoadingAvailability && !isBlocked && !availabilityError && (
            <TimeRangeSelector
              availableSlots={availableSlots}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              minimumHours={vehicle.minimumHours}
            />
          )}
        </div>
      )}

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
          placeholder="Any special requests..."
        />
      </label>

      <div className="rounded-lg bg-white p-4">
        <h3 className="text-lg font-semibold text-primary">Price Summary</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p>Hours: {selectedHours || 0}</p>
          <p>Base: ${basePrice.toFixed(2)}</p>
          {fuelChargeEnabled && vehicle.fuelChargePercent > 0 && <p>Fuel Charge: ${fuelCharge.toFixed(2)}</p>}
          <p className="pt-1 text-base font-semibold text-slate-900">Total: ${totalPrice.toFixed(2)}</p>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-amber-400"
      >
        Proceed to Payment
      </button>
    </form>
  );
}
