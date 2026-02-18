import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

type ContactBody = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactBody;
    const { name, email, phone, message } = body;

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(phone) || !isNonEmptyString(message)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const text = [
      "New contact form submission:",
      "",
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Phone: ${phone.trim()}`,
      "",
      "Message:",
      message.trim()
    ].join("\n");

    await getResend().emails.send({
      from: "ATX Boats and Buses <contact@atxboatsandbuses.com>",
      to: "bookings@atxboatsandbuses.com", // TODO: Replace with real business email
      replyTo: email.trim(),
      subject: "New Contact Form Submission — ATX Boats and Buses",
      text
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
