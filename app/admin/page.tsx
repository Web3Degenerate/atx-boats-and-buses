"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);

  async function fetchBookings() {
    const response = await fetch("/api/admin/bookings");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as BookingRow[];
    setBookings(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchBookings();
  }, [router]);

  async function handleCancel(bookingId: string, refund: boolean) {
    const confirmed = refund
      ? window.confirm("This will cancel the booking and refund the customer. Continue?")
      : window.confirm("This will cancel the booking with no refund. Continue?");

    if (!confirmed) {
      return;
    }

    setActionBookingId(bookingId);
    try {
      const response = await fetch("/api/admin/bookings/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bookingId, refund })
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (response.ok) {
        await fetchBookings();
        return;
      }

      window.alert("Failed to cancel booking.");
    } finally {
      setActionBookingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-900">
        <thead className="bg-slate-50">
          <tr>
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
          {bookings.map((booking) => (
            <tr key={booking.id}>
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
                <div className="flex gap-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
