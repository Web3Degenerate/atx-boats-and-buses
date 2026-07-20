import { NextRequest, NextResponse } from "next/server";
import { getBookingAlertRecipients } from "@/lib/booking-actions";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { getResend } from "@/lib/resend";

type CorporateInquiryBody = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  eventType?: string;
  headcount?: string;
  dates?: string;
  vehicleInterest?: string;
  notes?: string;
};

const EVENT_TYPES = [
  "Client appreciation",
  "Team offsite",
  "Conference transportation",
  "Executive travel",
  "Other"
];

const VEHICLE_INTERESTS = ["Boat charter", "Executive bus", "Both", "Not sure yet"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function clip(value: string | undefined, max = 500): string {
  return (value || "").trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(`corporate:${getClientIp(request)}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many inquiries. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as CorporateInquiryBody;

    if (!isNonEmptyString(body.name) || !isNonEmptyString(body.email) || !isNonEmptyString(body.company)) {
      return NextResponse.json({ error: "Name, company, and email are required." }, { status: 400 });
    }

    const eventType = EVENT_TYPES.includes(body.eventType || "") ? body.eventType! : "Other";
    const vehicleInterest = VEHICLE_INTERESTS.includes(body.vehicleInterest || "") ? body.vehicleInterest! : "Not sure yet";

    const recipients = await getBookingAlertRecipients();

    if (recipients.length === 0) {
      console.error("Corporate inquiry received but no alert recipients are configured.");
      return NextResponse.json({ error: "Unable to send inquiry. Please call us instead." }, { status: 500 });
    }

    const text = [
      "New corporate inquiry:",
      "",
      `Name: ${clip(body.name, 120)}`,
      `Company: ${clip(body.company, 160)}`,
      `Email: ${clip(body.email, 200)}`,
      `Phone: ${clip(body.phone, 50) || "n/a"}`,
      `Event type: ${eventType}`,
      `Headcount: ${clip(body.headcount, 40) || "n/a"}`,
      `Preferred dates: ${clip(body.dates, 200) || "n/a"}`,
      `Vehicle interest: ${vehicleInterest}`,
      "",
      "Notes:",
      clip(body.notes, 2000) || "(none)"
    ].join("\n");

    for (const recipient of recipients) {
      try {
        await getResend().emails.send({
          from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
          to: recipient,
          replyTo: body.email.trim(),
          subject: `Corporate inquiry: ${clip(body.company, 80)} — ${eventType}`,
          text
        });
      } catch (error) {
        console.error(`Corporate inquiry alert failed for ${recipient}:`, error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Corporate inquiry API error:", error);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
