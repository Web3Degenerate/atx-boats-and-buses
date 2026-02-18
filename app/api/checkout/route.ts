import { NextRequest, NextResponse } from "next/server";
import { vehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
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
};

type SettingRow = {
  value: string;
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
      notes
    } = body;

    if (!vehicleId || !date || !startTime || !endTime || !guestCount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const vehicle = vehicles.find((item) => item.id === vehicleId);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const durationHours = (toMinutes(endTime) - toMinutes(startTime)) / 60;

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

    const basePriceDollars = durationHours * vehicle.pricePerHour;
    const fuelChargeDollars = basePriceDollars * (appliedFuelChargePercent / 100);
    const totalPriceCents = Math.round((basePriceDollars + fuelChargeDollars) * 100);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_BASE_URL is not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual"
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: vehicle.name
            },
            unit_amount: totalPriceCents
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
        notes: notes ?? ""
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
