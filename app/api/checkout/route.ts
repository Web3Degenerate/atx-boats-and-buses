import { NextRequest, NextResponse } from "next/server";
import { vehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import { calculateSalesTaxCents, dollarsToCents } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";

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

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function POST(request: NextRequest) {
  try {
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

    const bannedEmailResult = await query<BannedEmailRow>(
      "SELECT id FROM banned_emails WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [customerEmail]
    );

    if (bannedEmailResult.rows[0]) {
      return NextResponse.json({ error: "banned" }, { status: 403 });
    }

    const vehicle = vehicles.find((item) => item.id === vehicleId);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const vehicleResult = await query<{ id: string }>(
      "SELECT id FROM vehicles WHERE slug = $1 LIMIT 1",
      [vehicle.slug]
    );
    const dbVehicleId = vehicleResult.rows[0]?.id;

    if (!dbVehicleId) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const actualEndDate = endDate || date;
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${actualEndDate}T${endTime}:00`);
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0 || durationHours < vehicle.minimumHours) {
      return NextResponse.json(
        { error: `Booking must be at least ${vehicle.minimumHours} hours` },
        { status: 400 }
      );
    }

    const settingResult = await query<SettingRow>(
      "SELECT value FROM site_settings WHERE key = 'fuel_charge_enabled' LIMIT 1"
    );

    const fuelChargeEnabled = settingResult.rows[0]?.value !== "false";
    const appliedFuelChargePercent = fuelChargeEnabled ? vehicle.fuelChargePercent : 0;

    const basePriceCents = dollarsToCents(durationHours * vehicle.pricePerHour);
    const fuelChargeCents = Math.round(basePriceCents * (appliedFuelChargePercent / 100));
    const rentalSubtotalCents = basePriceCents + fuelChargeCents;
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

    const discountedRentalSubtotalCents = appliedCoupon
      ? Math.round(rentalSubtotalCents * (1 - appliedCoupon.discount_percent / 100))
      : rentalSubtotalCents;
    const salesTaxCents = calculateSalesTaxCents(discountedRentalSubtotalCents);
    const totalPriceCents = discountedRentalSubtotalCents + salesTaxCents;
    const bookingDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilBooking = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isWithinTwoDays = daysUntilBooking <= 2;
    const depositCents = isWithinTwoDays ? totalPriceCents : Math.round(totalPriceCents * 0.2);
    const remainingCents = totalPriceCents - depositCents;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_BASE_URL is not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      payment_intent_data: {
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
        customerName,
        customerEmail,
        customerPhone,
        notes: notes ?? "",
        depositAmount: String(depositCents),
        remainingAmount: String(remainingCents),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {})
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
