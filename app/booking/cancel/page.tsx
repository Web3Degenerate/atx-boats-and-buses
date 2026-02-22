import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Cancelled",
  description: "Your booking was not completed."
};

export default function BookingCancelPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-primary">Booking Cancelled</h1>
      <p className="mt-4 text-slate-700">No charge was made. You can try again whenever you're ready.</p>
      <Link href="/" className="mt-8 inline-flex rounded-md bg-secondary px-5 py-3 font-semibold text-primary">
        Try Again
      </Link>
    </section>
  );
}
