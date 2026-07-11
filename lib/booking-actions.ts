import { query } from "@/lib/db";
import { getEmailTemplate, renderTemplate } from "@/lib/email-templates";
import { getResend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";
import { createWaiverLink } from "@/lib/waiver";

export type ActionBookingRow = {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  stripe_payment_intent_id: string | null;
  balance_payment_intent_id: string | null;
  balance_paid: boolean | null;
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_price: number;
  deposit_amount: number;
  remaining_amount: number;
  vehicle_name: string;
  vehicle_type: string;
};

export type BookingActionResult = { ok: true } | { ok: false; error: string };

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export async function getBookingForAction(bookingId: string): Promise<ActionBookingRow | null> {
  const result = await query<ActionBookingRow>(
    `
      SELECT
        b.id,
        b.status,
        b.customer_name,
        b.customer_email,
        b.stripe_payment_intent_id,
        b.balance_payment_intent_id,
        b.balance_paid,
        b.date::text AS date,
        b.start_time::text AS start_time,
        b.end_time::text AS end_time,
        b.guest_count,
        b.total_price,
        b.deposit_amount,
        b.remaining_amount,
        v.name AS vehicle_name,
        v.type AS vehicle_type
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.id = $1
      LIMIT 1
    `,
    [bookingId]
  );

  return result.rows[0] ?? null;
}

async function sendBookingConfirmationEmail(booking: ActionBookingRow, waiverLink: string): Promise<void> {
  const template = await getEmailTemplate(
    booking.remaining_amount > 0 ? "booking_confirmed_deposit" : "booking_confirmed_full"
  );

  if (template) {
    const renderedHtml = renderTemplate(template.html_body, {
      customerName: booking.customer_name,
      vehicleName: booking.vehicle_name,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      depositAmount: formatCurrency(booking.deposit_amount),
      remainingAmount: formatCurrency(booking.remaining_amount),
      totalAmount: formatCurrency(booking.deposit_amount + booking.remaining_amount)
    });

    await getResend().emails.send({
      from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
      to: booking.customer_email,
      subject: template.subject,
      html: `${renderedHtml}<p style="margin-top:16px;">Complete your waiver here: <a href="${waiverLink}">${waiverLink}</a></p>`
    });
    return;
  }

  const bodyText = booking.remaining_amount > 0
    ? `Hi ${booking.customer_name}, great news! Your booking for ${booking.vehicle_name} on ${booking.date} from ${booking.start_time} to ${booking.end_time} has been approved. Your 20% deposit of ${formatCurrency(booking.deposit_amount)} has been charged. Your remaining balance of ${formatCurrency(booking.remaining_amount)} will be automatically charged to your card on file 2 days before your booking. We look forward to seeing you! Thank you, ATX Boats and Buses`
    : `Hi ${booking.customer_name}, great news! Your booking for ${booking.vehicle_name} on ${booking.date} from ${booking.start_time} to ${booking.end_time} has been approved and your payment of ${formatCurrency(booking.deposit_amount)} has been processed. We look forward to seeing you! Thank you, ATX Boats and Buses`;

  await getResend().emails.send({
    from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
    to: booking.customer_email,
    subject: "Booking Confirmed — ATX Boats and Buses",
    text: `${bodyText}\n\nComplete your waiver here: ${waiverLink}`
  });
}

export async function approveBooking(bookingId: string): Promise<BookingActionResult> {
  const booking = await getBookingForAction(bookingId);

  if (!booking) {
    return { ok: false, error: "Booking not found." };
  }

  if (booking.status !== "pending") {
    return { ok: false, error: `This booking is already ${booking.status}.` };
  }

  if (booking.stripe_payment_intent_id) {
    try {
      await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);
    } catch (error) {
      console.error("Stripe capture failed:", error);
      return {
        ok: false,
        error: "Failed to capture the payment hold. It may have expired (holds last ~7 days) — contact the customer to rebook."
      };
    }
  }

  await query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [booking.id]);

  let waiverLink: string;
  const existingWaiver = await query<{ token: string }>(
    "SELECT token FROM waiver_links WHERE booking_id = $1 LIMIT 1",
    [booking.id]
  );

  if (existingWaiver.rows[0]?.token) {
    waiverLink = `${process.env.NEXT_PUBLIC_BASE_URL}/waiver/${existingWaiver.rows[0].token}`;
  } else {
    waiverLink = await createWaiverLink(booking.id, booking.vehicle_type, booking.guest_count, booking.date);
  }

  try {
    await sendBookingConfirmationEmail(booking, waiverLink);
  } catch (error) {
    console.error("Booking confirmation email failed:", error);
  }

  return { ok: true };
}

export async function rejectBooking(
  bookingId: string,
  options: { refund?: boolean; reason?: string } = {}
): Promise<BookingActionResult> {
  const { refund = true, reason } = options;
  const booking = await getBookingForAction(bookingId);

  if (!booking) {
    return { ok: false, error: "Booking not found." };
  }

  if (booking.status === "pending") {
    // Money was never captured — always release the hold; "no refund" doesn't apply.
    if (booking.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(booking.stripe_payment_intent_id);
      } catch (error) {
        console.error("Stripe hold release failed:", error);
        return { ok: false, error: "Failed to release the payment hold." };
      }
    }

    await query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [booking.id]);

    try {
      const reasonLine = reason ? ` Reason: ${reason}` : "";
      await getResend().emails.send({
        from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
        to: booking.customer_email,
        subject: "Booking Update — ATX Boats and Buses",
        text: `Hi ${booking.customer_name}, thank you for your interest in booking ${booking.vehicle_name} on ${booking.date}. Unfortunately, we are unable to accommodate this booking request. The hold on your payment has been released and you will not be charged.${reasonLine} If you have any questions, please don't hesitate to contact us. Thank you, ATX Boats and Buses`
      });
    } catch (error) {
      console.error("Resend decline email failed:", error);
    }

    return { ok: true };
  }

  if (booking.status === "confirmed") {
    if (refund) {
      if (booking.stripe_payment_intent_id) {
        try {
          await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
        } catch (error) {
          console.error("Stripe deposit refund failed:", error);
          return { ok: false, error: "Failed to refund deposit." };
        }
      }

      if (booking.balance_paid && booking.balance_payment_intent_id) {
        try {
          await stripe.refunds.create({ payment_intent: booking.balance_payment_intent_id });
        } catch (error) {
          console.error("Stripe balance refund failed:", error);
          return { ok: false, error: "Deposit refunded, but the balance refund failed. Refund the balance manually in Stripe." };
        }
      }
    }

    await query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [booking.id]);

    try {
      const template = await getEmailTemplate(refund ? "booking_cancelled_refund" : "booking_cancelled_no_refund");
      const reasonLine = reason ? ` Reason: ${reason}` : "";
      const refundedAmount = booking.balance_paid && booking.balance_payment_intent_id
        ? booking.deposit_amount + booking.remaining_amount
        : booking.deposit_amount;
      const customerEmailText = !refund
        ? `Hi ${booking.customer_name}, your booking for ${booking.vehicle_name} on ${booking.date} has been cancelled. Per our cancellation policy, the deposit is non-refundable. If you have questions, please contact us. Thank you, ATX Boats and Buses`
        : `Hi ${booking.customer_name}, your booking for ${booking.vehicle_name} on ${booking.date} has been cancelled and your payment of ${formatCurrency(refundedAmount)} has been refunded.${reasonLine} If you have any questions, please don't hesitate to contact us. Thank you, ATX Boats and Buses`;

      if (template) {
        const renderedHtml = renderTemplate(template.html_body, {
          customerName: booking.customer_name,
          vehicleName: booking.vehicle_name,
          date: booking.date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          depositAmount: formatCurrency(booking.deposit_amount),
          remainingAmount: formatCurrency(booking.remaining_amount),
          totalAmount: formatCurrency(booking.total_price)
        });

        await getResend().emails.send({
          from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
          to: booking.customer_email,
          subject: template.subject,
          html: renderedHtml
        });
      } else {
        await getResend().emails.send({
          from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
          to: booking.customer_email,
          subject: "Booking Update — ATX Boats and Buses",
          text: customerEmailText
        });
      }
    } catch (error) {
      console.error("Resend cancellation email failed:", error);
    }

    return { ok: true };
  }

  return { ok: false, error: `This booking is already ${booking.status}.` };
}

export async function getBookingAlertRecipients(): Promise<string[]> {
  const result = await query<{ value: string }>(
    "SELECT value FROM site_settings WHERE key = 'booking_alert_recipients' LIMIT 1"
  );

  const configured = (result.rows[0]?.value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return process.env.ADMIN_ALERT_EMAIL ? [process.env.ADMIN_ALERT_EMAIL] : [];
}

export async function sendBookingRequestAlerts(booking: ActionBookingRow, reviewUrl: string | null): Promise<void> {
  const recipients = await getBookingAlertRecipients();

  if (recipients.length === 0) {
    return;
  }

  // Kept short so SMS-gateway recipients (e.g. @vtext.com) get the essentials before truncation.
  const summary = `New booking request: ${booking.vehicle_name} ${booking.date} ${booking.start_time.slice(0, 5)}-${booking.end_time.slice(0, 5)}, ${booking.guest_count} guests, ${formatCurrency(booking.deposit_amount)} hold. ${booking.customer_name}.`;
  const text = reviewUrl ? `${summary}\nApprove or decline: ${reviewUrl}` : summary;

  for (const recipient of recipients) {
    try {
      await getResend().emails.send({
        from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
        to: recipient,
        subject: `Booking request: ${booking.vehicle_name} ${booking.date}`,
        text
      });
    } catch (error) {
      console.error(`Booking request alert failed for ${recipient}:`, error);
    }
  }
}
