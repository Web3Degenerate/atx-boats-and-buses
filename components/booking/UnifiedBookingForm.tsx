"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CalendarPicker from "@/components/booking/CalendarPicker";
import TimeSlotGrid from "@/components/booking/TimeSlotGrid";
import { calculateSalesTaxCents, centsToDollars, dollarsToCents, SALES_TAX_PERCENT_LABEL } from "@/lib/pricing";
import { TimeSlot, Vehicle } from "@/types";

type UnifiedBookingFormProps = {
  vehicle: Vehicle;
  autoApplyCoupon?: {
    id: string;
    code: string;
    discountPercent: number;
    validFrom: string;
    validTo: string;
    promoText: string | null;
  } | null;
};

type AvailabilityResponse = {
  vehicleId: string;
  date: string;
  isBlocked: boolean;
  slots: TimeSlot[];
};

type CouponResponse = {
  id: string;
  code: string;
  discountPercent: number;
};

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function differenceHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function generateSlotRange(startHour: number, endHour: number): string[] {
  const times: string[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    times.push(`${String(hour).padStart(2, "0")}:00`);
  }

  return times;
}

function buildSlotsForDisplay(date: string, apiSlots: TimeSlot[], timeRange: string[], isBlocked: boolean): TimeSlot[] {
  const apiSlotMap = new Map(apiSlots.map((slot) => [slot.startTime, slot]));

  return timeRange.map((startTime) => {
    const matching = apiSlotMap.get(startTime);
    return {
      date,
      startTime,
      endTime: matching?.endTime || startTime,
      isAvailable: isBlocked ? false : (matching?.isAvailable ?? true)
    };
  });
}

export default function UnifiedBookingForm({ vehicle, autoApplyCoupon }: UnifiedBookingFormProps) {
  const router = useRouter();
  const [pickupDate, setPickupDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [availablePickupSlots, setAvailablePickupSlots] = useState<TimeSlot[]>([]);
  const [availableReturnSlots, setAvailableReturnSlots] = useState<TimeSlot[]>([]);
  const [disabledPickupDates, setDisabledPickupDates] = useState<Date[]>([]);
  const [showPickupTimes, setShowPickupTimes] = useState(false);
  const [isLoadingPickup, setIsLoadingPickup] = useState(false);
  const [isLoadingReturn, setIsLoadingReturn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const pickupTimeRange = vehicle.type === "party-boat" ? generateSlotRange(9, 16) : generateSlotRange(9, 23);
  const returnTimeRange = vehicle.type === "party-boat"
    ? generateSlotRange(9, 20)
    : ["00:00", "01:00", "02:00", ...generateSlotRange(9, 23)];

  const validReturnDates = useMemo(() => {
    if (!pickupDate || !pickupTime) {
      return [] as string[];
    }

    const pickupDateTime = toDateTime(pickupDate, pickupTime);
    const earliestReturnDateTime = new Date(pickupDateTime.getTime() + vehicle.minimumHours * 60 * 60 * 1000);
    const latestReturnDateTime = new Date(pickupDateTime.getTime() + vehicle.maximumHours * 60 * 60 * 1000);

    const startDateOnly = new Date(
      earliestReturnDateTime.getFullYear(),
      earliestReturnDateTime.getMonth(),
      earliestReturnDateTime.getDate()
    );
    const endDateOnly = new Date(
      latestReturnDateTime.getFullYear(),
      latestReturnDateTime.getMonth(),
      latestReturnDateTime.getDate()
    );

    const dates: string[] = [];
    const cursor = new Date(startDateOnly);

    while (cursor <= endDateOnly) {
      dates.push(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }, [pickupDate, pickupTime, vehicle.minimumHours, vehicle.maximumHours]);

  const earliestReturnDate = useMemo(() => {
    if (!pickupDate || !pickupTime) {
      return undefined;
    }

    return new Date(toDateTime(pickupDate, pickupTime).getTime() + vehicle.minimumHours * 60 * 60 * 1000);
  }, [pickupDate, pickupTime, vehicle.minimumHours]);

  const latestReturnDate = useMemo(() => {
    if (!pickupDate || !pickupTime) {
      return undefined;
    }

    return new Date(toDateTime(pickupDate, pickupTime).getTime() + vehicle.maximumHours * 60 * 60 * 1000);
  }, [pickupDate, pickupTime, vehicle.maximumHours]);

  const filteredReturnSlots = useMemo(() => {
    if (!pickupDate || !pickupTime || !returnDate) {
      return availableReturnSlots;
    }

    const pickupDateTime = toDateTime(pickupDate, pickupTime);

    return availableReturnSlots.map((slot) => {
      const endDateTime = toDateTime(returnDate, slot.startTime);
      const hours = differenceHours(pickupDateTime, endDateTime);
      const meetsMinMax = hours >= vehicle.minimumHours && hours <= vehicle.maximumHours;
      const afterPickup = returnDate !== pickupDate || toMinutes(slot.startTime) > toMinutes(pickupTime);
      const isValid = slot.isAvailable && meetsMinMax && afterPickup;

      return { ...slot, isAvailable: isValid };
    });
  }, [availableReturnSlots, pickupDate, pickupTime, returnDate, vehicle.minimumHours, vehicle.maximumHours]);

  const selectedHours = useMemo(() => {
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      return 0;
    }

    return differenceHours(toDateTime(pickupDate, pickupTime), toDateTime(returnDate, returnTime));
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const basePriceCents = dollarsToCents(selectedHours * vehicle.pricePerHour);
  const fuelChargeCents = Math.round(basePriceCents * (vehicle.fuelChargePercent / 100));
  const rentalSubtotalCents = basePriceCents + fuelChargeCents;
  const optionalChargeLabel = vehicle.optionalChargeLabel || "Fuel Charge";
  const discountedRentalSubtotalCents = appliedCoupon
    ? Math.round(rentalSubtotalCents * (1 - appliedCoupon.discountPercent / 100))
    : rentalSubtotalCents;
  const discountAmountCents = rentalSubtotalCents - discountedRentalSubtotalCents;
  const salesTaxCents = calculateSalesTaxCents(discountedRentalSubtotalCents);
  const totalPriceCents = discountedRentalSubtotalCents + salesTaxCents;

  const daysUntilBooking = pickupDate
    ? Math.floor((new Date(pickupDate).getTime() - new Date(new Date().toDateString()).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const showDeposit = daysUntilBooking !== null && daysUntilBooking > 2;
  const depositAmountCents = Math.round(totalPriceCents * 0.2);
  const isAutoApplied = Boolean(
    autoApplyCoupon &&
    appliedCoupon?.id === autoApplyCoupon.id
  );

  useEffect(() => {
    if (
      autoApplyCoupon &&
      pickupDate &&
      pickupDate >= autoApplyCoupon.validFrom &&
      pickupDate <= autoApplyCoupon.validTo
    ) {
      setCouponCode(autoApplyCoupon.code);
      setAppliedCoupon(autoApplyCoupon);
    } else {
      setAppliedCoupon((prev) =>
        prev?.id === autoApplyCoupon?.id ? null : prev
      );
      setCouponCode((prev) =>
        prev === autoApplyCoupon?.code ? "" : prev
      );
      setCouponError("");
    }
  }, [autoApplyCoupon, pickupDate]);

  async function fetchAvailability(date: string, timeRange: string[]): Promise<TimeSlot[]> {
    const response = await fetch(`/api/availability?vehicleId=${vehicle.id}&date=${date}`);

    if (!response.ok) {
      throw new Error("Failed to fetch availability");
    }

    const data = (await response.json()) as AvailabilityResponse;
    return buildSlotsForDisplay(date, data.slots, timeRange, data.isBlocked);
  }

  function handlePickupDateChange(value: string) {
    setPickupDate(value);
    if (showPickupTimes) {
      setShowPickupTimes(false);
      setPickupTime("");
      setReturnDate("");
      setReturnTime("");
      setAvailablePickupSlots([]);
      setAvailableReturnSlots([]);
    }
  }

  async function handleViewPickupTimes() {
    if (!pickupDate || !guestCount) {
      return;
    }

    setIsLoadingPickup(true);
    setSubmitError("");

    try {
      const slots = await fetchAvailability(pickupDate, pickupTimeRange);
      setAvailablePickupSlots(slots);
      setShowPickupTimes(true);
    } catch (error) {
      console.error(error);
      setSubmitError("Unable to load pickup times. Please try again.");
    } finally {
      setIsLoadingPickup(false);
    }
  }

  async function handleApplyCoupon() {
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      setCouponError("Enter a coupon code.");
      setAppliedCoupon(null);
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: trimmedCode, vehicleId: vehicle.id })
      });

      const data = (await response.json()) as CouponResponse & { error?: string };

      if (!response.ok) {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid or expired coupon code.");
        return;
      }

      setAppliedCoupon({
        id: data.id,
        code: data.code,
        discountPercent: data.discountPercent
      });
      setCouponCode(data.code);
      setCouponError("");
    } catch (error) {
      console.error(error);
      setAppliedCoupon(null);
      setCouponError("Unable to validate coupon code.");
    } finally {
      setCouponLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchDisabledDates() {
      const now = new Date();
      const months: string[] = [];

      for (let index = 0; index < 3; index += 1) {
        const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
      }

      const allDisabled: Date[] = [];

      for (const month of months) {
        try {
          const response = await fetch(`/api/availability/month?vehicleId=${vehicle.id}&month=${month}`);
          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as { disabledDates?: string[] };
          for (const dateStr of data.disabledDates ?? []) {
            const [year, monthNumber, day] = dateStr.split("-").map(Number);
            allDisabled.push(new Date(year, monthNumber - 1, day));
          }
        } catch {
          // Ignore background disabled-date preload failures.
        }
      }

      if (isMounted) {
        setDisabledPickupDates(allDisabled);
      }
    }

    setDisabledPickupDates([]);
    fetchDisabledDates();

    return () => {
      isMounted = false;
    };
  }, [vehicle]);

  useEffect(() => {
    if (!pickupTime || !pickupDate) {
      setReturnDate("");
      setReturnTime("");
      setAvailableReturnSlots([]);
      return;
    }

    const earliest = validReturnDates[0] || "";
    setReturnDate(earliest);
    setReturnTime("");
  }, [pickupTime, pickupDate, validReturnDates]);

  useEffect(() => {
    if (!returnDate) {
      setAvailableReturnSlots([]);
      return;
    }

    async function loadReturnAvailability() {
      setIsLoadingReturn(true);
      setSubmitError("");
      setReturnTime("");

      try {
        const slots = await fetchAvailability(returnDate, returnTimeRange);
        setAvailableReturnSlots(slots);
      } catch (error) {
        console.error(error);
        setSubmitError("Unable to load return times. Please try again.");
        setAvailableReturnSlots([]);
      } finally {
        setIsLoadingReturn(false);
      }
    }

    loadReturnAvailability();
  }, [returnDate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!pickupDate || !guestCount || !pickupTime || !returnDate || !returnTime || !customerName || !customerEmail || !customerPhone) {
      setSubmitError("Please complete all required fields.");
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
          date: pickupDate,
          startTime: pickupTime,
          endDate: returnDate,
          endTime: returnTime,
          guestCount: Number(guestCount),
          customerName,
          customerEmail,
          customerPhone,
          notes,
          couponId: appliedCoupon?.id ?? null
        })
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (data.error === "banned") {
        router.push("/booking/banned");
        setIsSubmitting(false);
        return;
      }

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
    <form className="space-y-6 rounded-xl border border-white/10 bg-neutral-900 p-5" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-bold text-white">Book This Vehicle</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Minimum booking: {vehicle.minimumHours} hours · Maximum: {vehicle.maximumHours} hours
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-white/10 bg-neutral-800 p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <label className="flex-1 space-y-1">
            <span className="text-sm font-medium text-neutral-300">Pickup Date</span>
            <CalendarPicker
              placeholder="Select pickup date"
              selectedDate={pickupDate}
              onDateSelect={handlePickupDateChange}
              disabledDates={disabledPickupDates}
            />
          </label>

          <label className="flex-1 space-y-1">
            <span className="text-sm font-medium text-neutral-300">Guest Count</span>
            <select
              value={guestCount}
              onChange={(event) => setGuestCount(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-neutral-700 px-3 py-2 text-sm text-white"
            >
              <option value="">Number of guests</option>
              {Array.from({ length: vehicle.capacity }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!showPickupTimes && (
          <button
            type="button"
            disabled={!pickupDate || !guestCount || isLoadingPickup}
            onClick={handleViewPickupTimes}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoadingPickup ? "Loading..." : "View Available Pickup Times"}
          </button>
        )}
      </div>

      {showPickupTimes && (
        <TimeSlotGrid
          slots={availablePickupSlots.filter((s) => pickupTimeRange.includes(s.startTime))}
          selectedTime={pickupTime}
          onTimeSelect={setPickupTime}
          label="Select Pickup Time"
        />
      )}

      {pickupTime && (
        <div className="space-y-4 rounded-lg border border-white/10 bg-neutral-800 p-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-neutral-300">Return Date</span>
            <CalendarPicker
              placeholder="Select return date"
              selectedDate={returnDate}
              onDateSelect={setReturnDate}
              disabledBefore={earliestReturnDate}
              disabledAfter={latestReturnDate}
            />
          </label>

          {isLoadingReturn ? (
            <p className="text-sm text-neutral-400">Loading return times...</p>
          ) : (
            returnDate && (
              <TimeSlotGrid
                slots={filteredReturnSlots.filter((s) => s.isAvailable)}
                selectedTime={returnTime}
                onTimeSelect={setReturnTime}
                label="Select Return Time"
              />
            )
          )}
        </div>
      )}

      {returnTime && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-300">Name</span>
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-300">Email</span>
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-300">Phone</span>
              <input
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
                required
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-300">Notes</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
              placeholder={`Enter any special requests. If you would like to rent this ${vehicle.name} beyond the current ${vehicle.maximumHours} hour maximum rental period, please email us at info@atxboatsandbuses.com for approval before completing this request.`}
            />
          </label>

          <div className="rounded-lg bg-neutral-800 p-4">
            <h3 className="text-lg font-semibold text-white">Price Summary</h3>
            <div className="mt-2 space-y-1 text-sm text-neutral-300">
              <p>Hours: {selectedHours || 0}</p>
              <p>Base: {formatCurrency(centsToDollars(basePriceCents))}</p>
              {vehicle.fuelChargePercent > 0 && <p>{optionalChargeLabel}: {formatCurrency(centsToDollars(fuelChargeCents))}</p>}
              {appliedCoupon && (
                <p className="text-emerald-400">
                  Discount (-{appliedCoupon.discountPercent}%): -{formatCurrency(centsToDollars(discountAmountCents))}
                </p>
              )}
              <p>Sales Tax ({SALES_TAX_PERCENT_LABEL}): {formatCurrency(centsToDollars(salesTaxCents))}</p>
              <p className="pt-1 text-base font-semibold text-white">Total: {formatCurrency(centsToDollars(totalPriceCents))}</p>
              {showDeposit && (
                <p className="pt-1 text-base font-semibold text-emerald-400">20% Deposit Due Today: {formatCurrency(centsToDollars(depositAmountCents))}</p>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {isAutoApplied && autoApplyCoupon ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                  <p className="font-semibold">{autoApplyCoupon.code}</p>
                  <p>{autoApplyCoupon.discountPercent}% Coupon Applied To Your Reservation</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value);
                        setCouponError("");
                      }}
                      placeholder="Coupon code"
                      className="flex-1 rounded-md border border-white/10 bg-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                      <span>Applied: {appliedCoupon.code} (-{appliedCoupon.discountPercent}%)</span>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponCode(""); setCouponError(""); }}
                        className="text-base leading-none text-emerald-300 hover:text-white"
                        aria-label="Remove coupon"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-sm text-red-400">{couponError}</p>}
                </>
              )}
            </div>
          </div>

          {pickupDate && (
            <div className="rounded-lg bg-neutral-800 p-4 space-y-3 text-sm text-neutral-300">
              <h3 className="text-base font-semibold text-white">Booking Policies</h3>
              {showDeposit ? (
                <p>There is a nonrefundable 20% deposit at the time of booking. The remaining balance is due 2 days before the date of your reservation.</p>
              ) : (
                <p>Since this reservation is within 2 days of your booking, the entire balance of your rental is due today. Please note that this payment is nonrefundable since your reservation is within 2 days of your rental.</p>
              )}
              <p>Customers will receive a full refund in case of operator cancellation due to weather or other unforeseen circumstances.</p>
              <p>Every member of your party must complete our electronic waiver form before the start of your reservation. You will be provided with said electronic waiver after you complete the booking.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Processing..." : "Proceed to Payment"}
          </button>
        </>
      )}

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}
    </form>
  );
}
