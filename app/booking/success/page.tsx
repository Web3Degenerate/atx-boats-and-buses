import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Booking Request Received",
  description: "Your booking request has been received. We will confirm your reservation shortly.",
  path: "/booking/success",
  noIndex: true
});

export default function BookingSuccessPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-primary">Booking Request Received!</h1>
      <p className="mt-4 text-slate-700">
        Thank you! A temporary hold has been placed on your card — you will not be charged unless your booking is
        approved. We review requests quickly, and you&apos;ll receive a confirmation email with your waiver link shortly.
      </p>
      <Link href="/" className="mt-8 inline-flex rounded-md bg-secondary px-5 py-3 font-semibold text-primary">
        Back to Home
      </Link>
    </section>
  );
}
