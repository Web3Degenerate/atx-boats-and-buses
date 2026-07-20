import type { Metadata } from "next";
import { CalendarCheck, Handshake, Route, Sailboat } from "lucide-react";
import CorporateInquiryForm from "@/components/corporate/CorporateInquiryForm";
import JsonLd from "@/components/seo/JsonLd";
import TrustBand from "@/components/trust/TrustBand";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Corporate Event Transportation & Charters in Austin",
  description:
    "Plan a corporate offsite, client appreciation event, or executive charter with ATX Boats & Buses. Tell us about your event and we'll build the itinerary — Lake Austin, Lake Travis, and statewide.",
  path: "/corporate",
  image: "/images/boat-slider-image-default.webp"
});

const OFFERINGS = [
  {
    icon: Handshake,
    title: "Client Appreciation",
    text: "Private yacht or boat charters on Lake Austin and Lake Travis — the meeting your clients will actually remember."
  },
  {
    icon: CalendarCheck,
    title: "Team Offsites",
    text: "Take the quarterly offsite off-site for real. On-the-water sessions or an executive coach to the Hill Country."
  },
  {
    icon: Route,
    title: "Conference & Event Transport",
    text: "Executive coach service to Dallas, San Antonio, and Houston — your team travels together, works en route, and arrives on time."
  },
  {
    icon: Sailboat,
    title: "Executive Charters",
    text: "Board retreats, investor days, and leadership outings with a private, professional setting and no logistics on your plate."
  }
];

export default function CorporatePage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Corporate", path: "/corporate" }
        ])}
      />
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Corporate Events</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Your next offsite, planned for you
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-300">
            Tell us the occasion, the headcount, and the vibe — we handle the vessel or coach, the itinerary, the
            waivers, and the timing. One point of contact from inquiry to drop-off, for groups of 4 to 25.
          </p>
          <p className="mt-4 text-neutral-400">
            Prefer to talk?{" "}
            <a href={`tel:${siteConfig.telephone}`} className="font-semibold text-white underline decoration-emerald-400 underline-offset-4 hover:text-emerald-400">
              Call us directly
            </a>{" "}
            — or send the details below and we&apos;ll respond within one business day.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OFFERINGS.map((offering) => (
            <div key={offering.title} className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
              <offering.icon className="h-6 w-6 text-emerald-400" />
              <h2 className="mt-3 text-base font-semibold text-white">{offering.title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{offering.text}</p>
            </div>
          ))}
        </div>
      </section>

      <TrustBand />

      <section className="mx-auto max-w-3xl px-6 py-16 lg:px-12">
        <h2 className="text-2xl font-bold text-white">Request a proposal</h2>
        <p className="mt-2 text-neutral-400">
          A few details and we&apos;ll come back with a plan and pricing — no obligation.
        </p>
        <div className="mt-8">
          <CorporateInquiryForm />
        </div>
      </section>
    </>
  );
}
