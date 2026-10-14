import { BALANCE_DUE_DAYS, TERMS_VERSION } from "@/lib/balance-policy";
import { CAPTAIN_FEE_DAY_OF_STATEMENT, isCaptainFee } from "@/lib/captain-fee";
import { BOAT_SALES_TAX_RATE, isSalesTaxable } from "@/lib/sales-tax";
import { NextRequest, NextResponse } from "next/server";
import { vehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";
import { getVehicleBySlug } from "@/lib/vehicles";

type CheckoutRequestBody = {
  vehicleId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  endDate?: string;
  guestCount?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  agreedToTerms?: boolean;
  prepayCaptainFee?: boolean;
  notes?: string;
  couponId?: string | null;
};

type SettingRow = {
  value: string;
};

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
  vehicle_id: string | null;
};

type BannedEmailRow = {
  id: string;
};

// Stripe metadata values are capped at 500 characters.
const MAX_METADATA_VALUE_LENGTH = 450;

function isValidIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

function truncateForMetadata(value: string): string {
  return value.length > MAX_METADATA_VALUE_LENGTH ? value.slice(0, MAX_METADATA_VALUE_LENGTH) : value;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(`checkout:${getClientIp(request)}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many booking attempts. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as CheckoutRequestBody;

    const {
      vehicleId,
      date,
      startTime,
      endTime,
      endDate,
      guestCount,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      couponId
    } = body;

    if (!vehicleId || !date || !startTime || !endTime || !guestCount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (body.agreedToTerms !== true) {
      return NextResponse.json({ error: "Please agree to the Terms and Conditions to continue." }, { status: 400 });
    }

    if (
      !isValidIsoDate(date) ||
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      (endDate && !isValidIsoDate(endDate))
    ) {
      return NextResponse.json({ error: "Invalid date or time format" }, { status: 400 });
    }

    const bannedEmailResult = await query<BannedEmailRow>(
      "SELECT id FROM banned_emails WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [customerEmail]
    );

    if (bannedEmailResult.rows[0]) {
      return NextResponse.json({ error: "banned" }, { status: 403 });
    }

    const staticVehicle = vehicles.find((item) => item.id === vehicleId);

    if (!staticVehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Pricing, minimums, and fuel charge come from the DB (admin-managed), not the
    // static file — the static values are only used to resolve the short id to a slug.
    const vehicle = await getVehicleBySlug(staticVehicle.slug);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const dbVehicleId = vehicle.dbId;

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > vehicle.capacity) {
      return NextResponse.json(
        { error: `Guest count must be between 1 and ${vehicle.capacity}` },
        { status: 400 }
      );
    }

    const actualEndDate = endDate || date;
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${actualEndDate}T${endTime}:00`);
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

    if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours < vehicle.minimumHours) {
      return NextResponse.json(
        { error: `Booking must be at least ${vehicle.minimumHours} hours` },
        { status: 400 }
      );
    }

    if (durationHours > vehicle.maximumHours) {
      return NextResponse.json(
        { error: `Booking cannot exceed ${vehicle.maximumHours} hours` },
        { status: 400 }
      );
    }

    const settingResult = await query<SettingRow>(
      "SELECT value FROM site_settings WHERE key = 'fuel_charge_enabled' LIMIT 1"
    );

    const fuelChargeEnabled = settingResult.rows[0]?.value !== "false";
    const captainFeeOptional = isCaptainFee(vehicle.optionalChargeLabel) && vehicle.fuelChargePercent > 0;

    if (captainFeeOptional && typeof body.prepayCaptainFee !== "boolean") {
      return NextResponse.json({ error: "Please choose whether to prepay the captain's fee." }, { status: 400 });
    }

    const prepayCaptainFee = captainFeeOptional && body.prepayCaptainFee === true;
    const appliedFuelChargePercent = !fuelChargeEnabled || (captainFeeOptional && !prepayCaptainFee)
      ? 0
      : vehicle.fuelChargePercent;
    const captainFeeNote = !captainFeeOptional
      ? ""
      : prepayCaptainFee
        ? "[Captain's fee: PREPAID at checkout]"
        : `[Captain's fee: NOT prepaid. Customer agreed: "${CAPTAIN_FEE_DAY_OF_STATEMENT}"]`;
    const bookingNotes = [captainFeeNote, notes?.trim() ?? ""].filter(Boolean).join(" ");

    const basePriceDollars = durationHours * vehicle.pricePerHour;
    const fuelChargeDollars = basePriceDollars * (appliedFuelChargePercent / 100);
    const totalPriceCents = Math.round((basePriceDollars + fuelChargeDollars) * 100);
    let appliedCoupon: CouponRow | null = null;

    if (couponId) {
      const couponResult = await query<CouponRow>(
        `
          SELECT id, code, discount_percent, vehicle_id
          FROM coupons
          WHERE id = $1
            AND active = TRUE
            AND valid_from <= CURRENT_DATE
            AND valid_to >= CURRENT_DATE
          LIMIT 1
        `,
        [couponId]
      );

      appliedCoupon = couponResult.rows[0] || null;

      if (!appliedCoupon) {
        return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
      }

      if (appliedCoupon.vehicle_id !== null && appliedCoupon.vehicle_id !== dbVehicleId) {
        return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
      }
    }

    const discountMultiplier = appliedCoupon ? 1 - appliedCoupon.discount_percent / 100 : 1;
    const discountedSubtotalCents = appliedCoupon
      ? Math.round(totalPriceCents * discountMultiplier)
      : totalPriceCents;
    // Sales tax on boats: charter price after discount, excluding the captain's fee.
    const salesTaxCents = isSalesTaxable(vehicle.type)
      ? Math.round(basePriceDollars * 100 * discountMultiplier * BOAT_SALES_TAX_RATE)
      : 0;
    const discountedTotalCents = discountedSubtotalCents + salesTaxCents;
    const bookingDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilBooking = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isWithinBalanceWindow = daysUntilBooking <= BALANCE_DUE_DAYS;
    const depositCents = isWithinBalanceWindow ? discountedTotalCents : Math.round(discountedTotalCents * 0.2);
    const remainingCents = discountedTotalCents - depositCents;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_BASE_URL is not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      payment_intent_data: {
        // Authorization hold only — captured when an admin approves the request,
        // released (no charge, no fees) when declined.
        capture_method: "manual",
        setup_future_usage: "off_session"
      },
      customer_creation: "always",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: vehicle.name
            },
            unit_amount: depositCents
          },
          quantity: 1
        }
      ],
      customer_email: customerEmail,
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking/cancel`,
      metadata: {
        vehicleId,
        date,
        startTime,
        endTime,
        endDate: endDate || date,
        guestCount: String(guestCount),
        customerName: truncateForMetadata(customerName),
        customerEmail: truncateForMetadata(customerEmail),
        customerPhone: truncateForMetadata(customerPhone),
        notes: truncateForMetadata(bookingNotes),
        depositAmount: String(depositCents),
        remainingAmount: String(remainingCents),
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: TERMS_VERSION,
        ...(salesTaxCents > 0 ? { salesTax: String(salesTaxCents) } : {}),
        ...(captainFeeOptional ? { captainFee: prepayCaptainFee ? "prepaid" : "pay_captain_day_of" } : {}),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {})
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
