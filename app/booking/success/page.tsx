import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-primary">Booking Confirmed!</h1>
      <p className="mt-4 text-slate-700">Thank you for your booking. We have received your payment and will contact you shortly.</p>
      <Link href="/" className="mt-8 inline-flex rounded-md bg-secondary px-5 py-3 font-semibold text-primary">
        Back to Home
      </Link>
    </section>
  );
}
