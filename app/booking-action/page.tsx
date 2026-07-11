import type { Metadata } from "next";
import { getBookingForAction, type ActionBookingRow } from "@/lib/booking-actions";
import { verifyBookingActionToken } from "@/lib/booking-approval";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Review Booking Request",
  description: "Private ATX Boats & Buses booking review page.",
  path: "/booking-action",
  noIndex: true
});

type BookingActionPageProps = {
  searchParams: {
    token?: string;
    result?: string;
    error?: string;
  };
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-xl">{children}</div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right text-neutral-200">{value}</span>
    </p>
  );
}

export default async function BookingActionPage({ searchParams }: BookingActionPageProps) {
  const { token, result, error } = searchParams;
  const bookingId = token ? verifyBookingActionToken(token) : null;

  if (!bookingId) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Link invalid or expired</h1>
        <p className="mt-3 text-neutral-400">
          This review link is no longer valid. Booking requests can still be managed from the admin dashboard.
        </p>
      </Shell>
    );
  }

  const booking: ActionBookingRow | null = await getBookingForAction(bookingId);

  if (!booking) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Booking not found</h1>
        <p className="mt-3 text-neutral-400">This booking no longer exists.</p>
      </Shell>
    );
  }

  const banner = result === "approved"
    ? { tone: "text-emerald-400", text: "Booking approved. The deposit has been captured and the customer received their confirmation and waiver link." }
    : result === "declined"
      ? { tone: "text-amber-400", text: "Booking declined. The hold was released and the customer has been notified — they were never charged." }
      : error
        ? { tone: "text-red-400", text: error }
        : null;

  return (
    <Shell>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Booking Request</p>
      <h1 className="mt-2 text-2xl font-bold text-white">{booking.vehicle_name}</h1>

      {banner && <p className={`mt-4 text-sm font-medium ${banner.tone}`}>{banner.text}</p>}

      <div className="mt-6">
        <DetailRow label="Customer" value={booking.customer_name} />
        <DetailRow label="Date" value={booking.date} />
        <DetailRow label="Time" value={`${booking.start_time.slice(0, 5)} – ${booking.end_time.slice(0, 5)}`} />
        <DetailRow label="Guests" value={String(booking.guest_count)} />
        <DetailRow label="Hold on card" value={formatCurrency(booking.deposit_amount)} />
        <DetailRow label="Total booking value" value={formatCurrency(booking.total_price)} />
        <DetailRow label="Status" value={booking.status} />
      </div>

      {booking.status === "pending" ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <form method="POST" action="/api/booking-action" className="flex-1">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="approve" />
            <button
              type="submit"
              className="w-full rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              ✓ Approve — capture {formatCurrency(booking.deposit_amount)}
            </button>
          </form>
          <form method="POST" action="/api/booking-action" className="flex-1">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="decline" />
            <button
              type="submit"
              className="w-full rounded-md border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              ✕ Decline — release hold
            </button>
          </form>
        </div>
      ) : (
        !banner && (
          <p className="mt-6 text-sm text-neutral-400">
            This request has already been {booking.status === "confirmed" ? "approved" : booking.status}. No further action is available from this link.
          </p>
        )
      )}
    </Shell>
  );
}
