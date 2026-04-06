import { query } from "@/lib/db";

type SignedWaiverPdfRow = {
  id: string;
  signer_type: "adult" | "guardian";
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  signature_data: string;
  esign_consent: boolean;
  ip_address: string | null;
  signed_at: string;
  vehicle_type: string;
  trip_date: string;
  template_title: string;
  template_body: string;
  customer_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
};

type MinorRow = {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  date_of_birth: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatFullName(first: string, last: string, middle?: string | null): string {
  return [first, middle || "", last].filter(Boolean).join(" ");
}

function formatAddress(line1: string, line2: string | null, city: string, state: string, zip: string): string {
  const parts = [line1, line2 || "", `${city}, ${state} ${zip}`].filter(Boolean);
  return parts.join(", ");
}

export async function generateWaiverPDF(signedWaiverId: string): Promise<Buffer> {
  const signedWaiverResult = await query<SignedWaiverPdfRow>(
    `
      SELECT
        sw.id,
        sw.signer_type,
        sw.first_name,
        sw.last_name,
        sw.middle_name,
        sw.email,
        sw.phone,
        sw.date_of_birth::text,
        sw.address_line1,
        sw.address_line2,
        sw.city,
        sw.state,
        sw.zip,
        sw.signature_data,
        sw.esign_consent,
        sw.ip_address,
        sw.signed_at::text,
        wl.vehicle_type,
        wl.trip_date::text,
        wt.title AS template_title,
        wt.body AS template_body,
        b.customer_name,
        b.date::text AS booking_date,
        b.start_time::text,
        b.end_time::text
      FROM signed_waivers sw
      JOIN waiver_links wl ON wl.id = sw.waiver_link_id
      JOIN bookings b ON b.id = wl.booking_id
      JOIN waiver_templates wt ON wt.vehicle_type = wl.vehicle_type
      WHERE sw.id = $1
      LIMIT 1
    `,
    [signedWaiverId]
  );

  const signedWaiver = signedWaiverResult.rows[0];

  if (!signedWaiver) {
    throw new Error("Signed waiver not found for PDF generation.");
  }

  const minorResult =
    signedWaiver.signer_type === "guardian"
      ? await query<MinorRow>(
          `
            SELECT
              first_name,
              last_name,
              middle_name,
              date_of_birth::text,
              phone,
              address_line1,
              address_line2,
              city,
              state,
              zip
            FROM waiver_minors
            WHERE signed_waiver_id = $1
            ORDER BY last_name, first_name
          `,
          [signedWaiverId]
        )
      : { rows: [] as MinorRow[] };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addWrappedText = (text: string, fontSize = 11, gap = 16) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize + 4;
    ensureSpace(lines.length * lineHeight + gap);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + gap;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ATX Boats and Buses", pageWidth / 2, y, { align: "center" });
  y += 28;

  doc.setFontSize(14);
  doc.text(signedWaiver.template_title, pageWidth / 2, y, { align: "center" });
  y += 28;

  doc.setFont("helvetica", "normal");
  addWrappedText(
    `Trip Date: ${signedWaiver.booking_date}    Start: ${signedWaiver.start_time}    End: ${signedWaiver.end_time}`,
    11,
    10
  );
  addWrappedText(`Primary Customer: ${signedWaiver.customer_name}`, 11, 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  ensureSpace(24);
  doc.text("Waiver Terms", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  addWrappedText(stripHtml(signedWaiver.template_body), 10, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  ensureSpace(24);
  doc.text("Signer Information", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  addWrappedText(`Name: ${formatFullName(signedWaiver.first_name, signedWaiver.last_name, signedWaiver.middle_name)}`, 11, 8);
  addWrappedText(`Email: ${signedWaiver.email}`, 11, 8);
  addWrappedText(`Phone: ${signedWaiver.phone}`, 11, 8);
  if (signedWaiver.signer_type === "adult") {
    addWrappedText(`Date of Birth: ${signedWaiver.date_of_birth}`, 11, 8);
  }
  addWrappedText(
    `Address: ${formatAddress(
      signedWaiver.address_line1,
      signedWaiver.address_line2,
      signedWaiver.city,
      signedWaiver.state,
      signedWaiver.zip
    )}`,
    11,
    16
  );

  if (signedWaiver.signer_type === "guardian" && minorResult.rows.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    ensureSpace(24);
    doc.text("Minor(s) Covered", margin, y);
    y += 18;
    doc.setFont("helvetica", "normal");

    minorResult.rows.forEach((minor, index) => {
      addWrappedText(
        `Minor #${index + 1}: ${formatFullName(minor.first_name, minor.last_name, minor.middle_name)}`,
        11,
        8
      );
      addWrappedText(`Date of Birth: ${minor.date_of_birth}`, 11, 8);
      if (minor.phone) {
        ensureSpace(6);
        doc.text(`Phone: ${minor.phone}`, margin, y);
        y += 6;
      }
      addWrappedText(
        `Address: ${formatAddress(minor.address_line1, minor.address_line2, minor.city, minor.state, minor.zip)}`,
        11,
        14
      );
    });
  }

  if (signedWaiver.signature_data.startsWith("data:image")) {
    ensureSpace(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Signature", margin, y);
    y += 12;
    doc.addImage(signedWaiver.signature_data, "PNG", margin, y, 220, 80);
    y += 96;
  }

  addWrappedText("Electronic signature consent granted", 11, 12);
  addWrappedText(`Signed on ${signedWaiver.signed_at} | IP: ${signedWaiver.ip_address || "Unavailable"}`, 10, 0);

  return Buffer.from(doc.output("arraybuffer"));
}
