import Link from "next/link";

export default function BookingBannedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight">Sorry, we are not able to process your reservation at this time.</h1>
        <p className="mt-4 text-neutral-300">
          For more information please email{" "}
          <a href="mailto:info@atxboatsandbuses.com" className="font-medium text-white underline underline-offset-4">
            info@atxboatsandbuses.com
          </a>
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
