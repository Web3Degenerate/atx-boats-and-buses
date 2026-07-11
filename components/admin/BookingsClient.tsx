"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ManualBookingForm from "@/components/admin/ManualBookingForm";

type BookingRow = {
  id: string;
  vehicle_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_price: number;
  deposit_amount: number;
  stripe_payment_intent_id: string | null;
  status: string;
};

function isAwaitingPayment(booking: BookingRow): boolean {
  // Public bookings always carry a payment intent from checkout; only manual
  // bookings sit confirmed with an amount due and no payment intent yet.
  return booking.status === "confirmed" && booking.deposit_amount > 0 && !booking.stripe_payment_intent_id;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-slate-200 text-slate-600"
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default function BookingsClient() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  async function fetchBookings() {
    try {
      const response = await fetch("/api/admin/bookings");

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`Bookings request failed with status ${response.status}`);
      }

      const data = (await response.json()) as BookingRow[];
      setBookings(data);
    } catch (error) {
      console.error("Failed to load admin bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, [router]);

  async function postAction(url: string, body: Record<string, unknown>, failureMessage: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        return false;
      }

      if (response.ok) {
        await fetchBookings();
        return true;
      }

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(data?.error || failureMessage);
      return false;
    } catch (error) {
      console.error(`${failureMessage}:`, error);
      window.alert(`${failureMessage} Check your connection and try again.`);
      return false;
    } finally {
      setActionBookingId(null);
    }
  }

  async function handleApprove(booking: BookingRow) {
    const confirmed = window.confirm(
      `Approve this booking and capture the ${formatCurrency(booking.deposit_amount)} hold?`
    );

    if (!confirmed) {
      return;
    }

    setActionBookingId(booking.id);
    await postAction("/api/admin/bookings/approve", { bookingId: booking.id }, "Failed to approve booking.");
  }

  async function handleDecline(booking: BookingRow) {
    const confirmed = window.confirm(
      "Decline this booking request? The hold will be released and the customer will not be charged."
    );

    if (!confirmed) {
      return;
    }

    setActionBookingId(booking.id);
    await postAction("/api/admin/bookings/reject", { bookingId: booking.id, refund: true }, "Failed to decline booking.");
  }

  async function handleResendPaymentLink(booking: BookingRow) {
    const confirmed = window.confirm(
      `Send ${booking.customer_name} a fresh payment link for ${formatCurrency(booking.deposit_amount)}?`
    );

    if (!confirmed) {
      return;
    }

    setActionBookingId(booking.id);
    const succeeded = await postAction(
      "/api/admin/bookings/payment-link",
      { bookingId: booking.id },
      "Failed to send payment link."
    );

    if (succeeded) {
      window.alert("Payment link sent to the customer.");
    }
  }

  async function handleCancel(bookingId: string, refund: boolean) {
    const confirmed = refund
      ? window.confirm("This will cancel the booking and refund the customer. Continue?")
      : window.confirm("This will cancel the booking with no refund. Continue?");

    if (!confirmed) {
      return;
    }

    setActionBookingId(bookingId);
    await postAction("/api/admin/bookings/reject", { bookingId, refund }, "Failed to cancel booking.");
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const otherBookings = bookings.filter((booking) => booking.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => setShowManualForm((prev) => !prev)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          {showManualForm ? "Close Manual Booking" : "+ New Manual Booking"}
        </button>
        {showManualForm && (
          <div className="mt-3">
            <ManualBookingForm onCreated={fetchBookings} />
          </div>
        )}
      </div>

      {pendingBookings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-bold text-amber-900">
            Pending Approval ({pendingBookings.length})
          </h2>
          <p className="mt-1 text-xs text-amber-800">
            Card holds expire after ~7 days — approve or decline promptly. Declining releases the hold with no charge and no fees.
          </p>
          <div className="mt-3 space-y-3">
            {pendingBookings.map((booking) => (
              <div key={booking.id} className="rounded-md border border-amber-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-900">
                    <p className="font-semibold">
                      {booking.vehicle_name} — {booking.date} · {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}
                    </p>
                    <p className="text-slate-600">
                      {booking.customer_name} · {booking.guest_count} guests · {booking.customer_phone} · {booking.customer_email}
                    </p>
                    <p className="text-slate-600">
                      Hold: <span className="font-semibold">{formatCurrency(booking.deposit_amount)}</span> · Total value: {formatCurrency(booking.total_price)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(booking)}
                      disabled={actionBookingId !== null}
                      className="rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                    >
                      {actionBookingId === booking.id ? "Working..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDecline(booking)}
                      disabled={actionBookingId !== null}
                      className="rounded border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-70"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-900">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Vehicle</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Customer</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Email</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Phone</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Date</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Time</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Guests</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Total</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {otherBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={booking.status} />
                    {isAwaitingPayment(booking) && (
                      <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                        unpaid
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">{booking.vehicle_name}</td>
                <td className="px-3 py-2">{booking.customer_name}</td>
                <td className="px-3 py-2">{booking.customer_email}</td>
                <td className="px-3 py-2">{booking.customer_phone}</td>
                <td className="px-3 py-2">{booking.date}</td>
                <td className="px-3 py-2">
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                </td>
                <td className="px-3 py-2">{booking.guest_count}</td>
                <td className="px-3 py-2">{formatCurrency(booking.total_price)}</td>
                <td className="px-3 py-2">
                  {booking.status === "confirmed" ? (
                    <div className="flex gap-2">
                      {isAwaitingPayment(booking) && (
                        <button
                          onClick={() => handleResendPaymentLink(booking)}
                          disabled={actionBookingId !== null}
                          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-70"
                        >
                          Resend Payment Link
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(booking.id, true)}
                        disabled={actionBookingId !== null}
                        className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-70"
                      >
                        Admin Cancel
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id, false)}
                        disabled={actionBookingId !== null}
                        className="rounded bg-neutral-500 px-3 py-1 text-xs text-white hover:bg-neutral-600 disabled:opacity-70"
                      >
                        Customer Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
