import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { generateWaiverPDF } from "@/lib/waiver-pdf";

type SignerType = "adult" | "guardian";

type MinorInput = {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  date_of_birth?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type WaiverSignRequest = {
  token?: string;
  signer_type?: SignerType;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  signature_data?: string;
  esign_consent?: boolean;
  minors?: MinorInput[];
};

type WaiverLinkRow = {
  waiver_link_id: string;
};

type InsertedWaiverRow = {
  id: string;
};

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function extractClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

function validateMinor(minor: MinorInput, index: number): string | null {
  if (!minor.first_name?.trim()) return `Minor #${index + 1} first name is required.`;
  if (!minor.last_name?.trim()) return `Minor #${index + 1} last name is required.`;
  if (!minor.date_of_birth) return `Minor #${index + 1} date of birth is required.`;
  if (calculateAge(minor.date_of_birth) >= 18) return `Minor #${index + 1} must be under 18 years old.`;
  if (!minor.address_line1?.trim()) return `Minor #${index + 1} address line 1 is required.`;
  if (!minor.city?.trim()) return `Minor #${index + 1} city is required.`;
  if (!minor.state?.trim()) return `Minor #${index + 1} state is required.`;
  if (!minor.zip?.trim()) return `Minor #${index + 1} ZIP is required.`;

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WaiverSignRequest;

    if (!body.token) {
      return NextResponse.json({ error: "Waiver token is required." }, { status: 400 });
    }

    if (body.signer_type !== "adult" && body.signer_type !== "guardian") {
      return NextResponse.json({ error: "Invalid signer type." }, { status: 400 });
    }

    const waiverLinkResult = await query<WaiverLinkRow>(
      "SELECT id AS waiver_link_id FROM waiver_links WHERE token = $1 LIMIT 1",
      [body.token]
    );

    const waiverLink = waiverLinkResult.rows[0];

    if (!waiverLink) {
      return NextResponse.json({ error: "Waiver link not found." }, { status: 404 });
    }

    if (!body.first_name?.trim()) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }
    if (!body.last_name?.trim()) {
      return NextResponse.json({ error: "Last name is required." }, { status: 400 });
    }
    if (!body.email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: "Phone is required." }, { status: 400 });
    }
    if (!body.address_line1?.trim()) {
      return NextResponse.json({ error: "Address line 1 is required." }, { status: 400 });
    }
    if (!body.city?.trim()) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }
    if (!body.state?.trim()) {
      return NextResponse.json({ error: "State is required." }, { status: 400 });
    }
    if (!body.zip?.trim()) {
      return NextResponse.json({ error: "ZIP is required." }, { status: 400 });
    }
    if (!body.esign_consent) {
      return NextResponse.json({ error: "Electronic signature consent is required." }, { status: 400 });
    }
    if (!body.signature_data?.trim()) {
      return NextResponse.json({ error: "Signature is required." }, { status: 400 });
    }

    let signerDateOfBirth = body.date_of_birth?.trim() || "";

    if (body.signer_type === "adult") {
      if (!signerDateOfBirth) {
        return NextResponse.json({ error: "Date of birth is required." }, { status: 400 });
      }
      if (calculateAge(signerDateOfBirth) < 18) {
        return NextResponse.json({ error: "Adult signer must be at least 18 years old." }, { status: 400 });
      }
    } else {
      if (!Array.isArray(body.minors) || body.minors.length === 0) {
        return NextResponse.json({ error: "At least one minor is required." }, { status: 400 });
      }

      for (const [index, minor] of body.minors.entries()) {
        const validationError = validateMinor(minor, index);
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 });
        }
      }

      // The current guardian form does not collect DOB, but the table requires a non-null value.
      signerDateOfBirth = "1900-01-01";
    }

    const userAgent = request.headers.get("user-agent");
    const ipAddress = extractClientIp(request);

    const insertResult = await query<InsertedWaiverRow>(
      `
        INSERT INTO signed_waivers (
          waiver_link_id,
          signer_type,
          first_name,
          last_name,
          middle_name,
          email,
          phone,
          date_of_birth,
          address_line1,
          address_line2,
          city,
          state,
          zip,
          signature_data,
          esign_consent,
          ip_address,
          user_agent
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::date, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING id
      `,
      [
        waiverLink.waiver_link_id,
        body.signer_type,
        body.first_name.trim(),
        body.last_name.trim(),
        body.middle_name?.trim() || null,
        body.email.trim(),
        body.phone.trim(),
        signerDateOfBirth,
        body.address_line1.trim(),
        body.address_line2?.trim() || null,
        body.city.trim(),
        body.state.trim(),
        body.zip.trim(),
        body.signature_data,
        body.esign_consent,
        ipAddress,
        userAgent
      ]
    );

    const signedWaiverId = insertResult.rows[0]?.id;

    if (!signedWaiverId) {
      return NextResponse.json({ error: "Unable to save signed waiver." }, { status: 500 });
    }

    if (body.signer_type === "guardian" && Array.isArray(body.minors)) {
      for (const minor of body.minors) {
        await query(
          `
            INSERT INTO waiver_minors (
              signed_waiver_id,
              first_name,
              last_name,
              middle_name,
              date_of_birth,
              address_line1,
              address_line2,
              city,
              state,
              zip
            )
            VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10)
          `,
          [
            signedWaiverId,
            minor.first_name?.trim(),
            minor.last_name?.trim(),
            minor.middle_name?.trim() || null,
            minor.date_of_birth,
            minor.address_line1?.trim(),
            minor.address_line2?.trim() || null,
            minor.city?.trim(),
            minor.state?.trim(),
            minor.zip?.trim()
          ]
        );
      }
    }

    const pdfBuffer = await generateWaiverPDF(signedWaiverId);

    await query("UPDATE signed_waivers SET pdf_data = $2 WHERE id = $1", [signedWaiverId, pdfBuffer]);

    try {
      const resend = getResend();
      await resend.emails.send({
        from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
        to: body.email.trim(),
        subject: "Your Signed Waiver — ATX Boats and Buses",
        html: "<p>Your signed waiver is attached for your records.</p>",
        attachments: [
          {
            filename: "ATX-Waiver-Signed.pdf",
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      });
    } catch (emailError) {
      console.error("Failed to send signed waiver email:", emailError);
    }

    return NextResponse.json({ success: true, id: signedWaiverId });
  } catch (error) {
    console.error("Waiver signing failed:", error);
    return NextResponse.json({ error: "Unable to sign waiver." }, { status: 500 });
  }
}
