import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getResend } from "@/lib/resend";

export const dynamic = "force-dynamic";

type ReminderRow = {
  waiver_link_id: string;
  customer_name: string;
  customer_email: string;
  vehicle_name: string;
  trip_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  token: string;
  signed_count: number;
  reminder_type: "7day" | "3day" | "1day";
};

type ReminderSentRow = {
  id: string;
};

function getReminderDayCount(reminderType: ReminderRow["reminder_type"]): number {
  if (reminderType === "7day") return 7;
  if (reminderType === "3day") return 3;
  return 1;
}

function getReminderTone(reminderType: ReminderRow["reminder_type"], remainingGuests: number): string {
  if (reminderType === "7day") {
    return `There is still plenty of time to finish your waiver, but ${remainingGuests} guest${remainingGuests === 1 ? "" : "s"} still need to sign before your trip.`;
  }

  if (reminderType === "3day") {
    return `Your trip is coming up soon, and ${remainingGuests} guest${remainingGuests === 1 ? "" : "s"} still need to complete the waiver.`;
  }

  return `Your trip is almost here. ${remainingGuests} guest${remainingGuests === 1 ? "" : "s"} still need to sign before arrival, so please complete this today.`;
}

async function sendReminder(row: ReminderRow) {
  const dayCount = getReminderDayCount(row.reminder_type);
  const remainingGuests = row.guest_count - row.signed_count;
  const waiverUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/waiver/${row.token}`;

  await getResend().emails.send({
    from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
    to: row.customer_email,
    subject: `Waiver Reminder — Your trip is in ${dayCount} day${dayCount === 1 ? "" : "s"}!`,
    html: `
      <p>Hi ${row.customer_name},</p>
      <p>${row.signed_count} of ${row.guest_count} guests have signed your waiver — ${remainingGuests} remaining.</p>
      <p>${getReminderTone(row.reminder_type, remainingGuests)}</p>
      <p>Your ${row.vehicle_name} trip is scheduled for ${row.trip_date} from ${row.start_time} to ${row.end_time}.</p>
      <p><a href="${waiverUrl}">Complete your waiver here</a></p>
      <p>Thank you,<br />ATX Boats and Buses</p>
    `
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminderResult = await query<ReminderRow>(
    `
      SELECT
        wl.id AS waiver_link_id,
        b.customer_name,
        b.customer_email,
        v.name AS vehicle_name,
        b.date::text AS trip_date,
        b.start_time::text,
        b.end_time::text,
        wl.guest_count,
        wl.token,
        COUNT(sw.id)::int AS signed_count,
        CASE
          WHEN b.date = CURRENT_DATE + INTERVAL '7 days' THEN '7day'
          WHEN b.date = CURRENT_DATE + INTERVAL '3 days' THEN '3day'
          ELSE '1day'
        END AS reminder_type
      FROM waiver_links wl
      JOIN bookings b ON b.id = wl.booking_id
      JOIN vehicles v ON v.id = b.vehicle_id
      LEFT JOIN signed_waivers sw ON sw.waiver_link_id = wl.id
      WHERE b.status = 'confirmed'
        AND b.date IN (
          CURRENT_DATE + INTERVAL '7 days',
          CURRENT_DATE + INTERVAL '3 days',
          CURRENT_DATE + INTERVAL '1 day'
        )
      GROUP BY
        wl.id,
        b.customer_name,
        b.customer_email,
        v.name,
        b.date,
        b.start_time,
        b.end_time,
        wl.guest_count,
        wl.token
      HAVING COUNT(sw.id) < wl.guest_count
      ORDER BY b.date ASC, b.start_time ASC
    `
  );

  let sent = 0;

  for (const row of reminderResult.rows) {
    const alreadySentResult = await query<ReminderSentRow>(
      `
        SELECT id
        FROM waiver_reminders_sent
        WHERE waiver_link_id = $1 AND reminder_type = $2
        LIMIT 1
      `,
      [row.waiver_link_id, row.reminder_type]
    );

    if (alreadySentResult.rows[0]) {
      continue;
    }

    try {
      await sendReminder(row);
      await query(
        `
          INSERT INTO waiver_reminders_sent (waiver_link_id, reminder_type)
          VALUES ($1, $2)
        `,
        [row.waiver_link_id, row.reminder_type]
      );
      sent += 1;
    } catch (error) {
      console.error(`Failed to send waiver reminder for waiver link ${row.waiver_link_id}:`, error);
    }
  }

  return NextResponse.json({ sent });
}
