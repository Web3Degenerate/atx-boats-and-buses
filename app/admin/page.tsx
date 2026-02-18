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
  status: string;
  created_at: string;
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
    const token = window.localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/bookings", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      window.localStorage.removeItem("admin_token");
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

  function getStatusClasses(status: string): string {
    if (status === "pending_approval") {
      return "bg-yellow-100 text-yellow-800";
    }
    if (status === "confirmed") {
      return "bg-green-100 text-green-800";
    }
    if (status === "cancelled") {
      return "bg-red-100 text-red-800";
    }
    return "bg-slate-100 text-slate-700";
  }

  async function handleApprove(bookingId: string) {
    const token = window.localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    setActionBookingId(bookingId);
    try {
      const response = await fetch("/api/admin/bookings/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId })
      });

      if (response.status === 401) {
        window.localStorage.removeItem("admin_token");
        router.replace("/admin/login");
        return;
      }

      if (response.ok) {
        await fetchBookings();
      }
    } finally {
      setActionBookingId(null);
    }
  }

  async function handleReject(bookingId: string) {
    const token = window.localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const reason = window.prompt("Optional rejection reason:") || "";

    setActionBookingId(bookingId);
    try {
      const response = await fetch("/api/admin/bookings/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId, reason })
      });

      if (response.status === 401) {
        window.localStorage.removeItem("admin_token");
        router.replace("/admin/login");
        return;
      }

      if (response.ok) {
        await fetchBookings();
      }
    } finally {
      setActionBookingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Vehicle</th>
            <th className="px-3 py-2 text-left font-semibold">Customer</th>
            <th className="px-3 py-2 text-left font-semibold">Email</th>
            <th className="px-3 py-2 text-left font-semibold">Phone</th>
            <th className="px-3 py-2 text-left font-semibold">Date</th>
            <th className="px-3 py-2 text-left font-semibold">Time</th>
            <th className="px-3 py-2 text-left font-semibold">Guests</th>
            <th className="px-3 py-2 text-left font-semibold">Total</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold">Booked At</th>
            <th className="px-3 py-2 text-left font-semibold">Actions</th>
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
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(booking.status)}`}>
                  {booking.status}
                </span>
              </td>
              <td className="px-3 py-2">{new Date(booking.created_at).toLocaleString()}</td>
              <td className="px-3 py-2">
                {booking.status === "pending_approval" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(booking.id)}
                      disabled={actionBookingId !== null}
                      className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-70"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(booking.id)}
                      disabled={actionBookingId !== null}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-70"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
