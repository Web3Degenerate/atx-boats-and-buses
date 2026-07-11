import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import VehicleCard from "@/components/vehicles/VehicleCard";
import FaqCard from "@/components/faq/FaqCard";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildMetadata,
  buildVehicleItemListJsonLd,
  type FaqItem
} from "@/lib/seo";
import { getPublishedFaqs, stripHtml } from "@/lib/faqs";
import { getVehicles } from "@/lib/vehicles";
import type { Vehicle } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Austin Executive Bus Rentals & Corporate Motorcoach Charters",
  description:
    "Rent an executive bus or motorcoach in Austin for corporate offsites, client appreciation events, and executive group transportation.",
  path: "/buses",
  image: "/images/bus-slider-image-default.webp"
});

// Pricing and capacity stay computed from live vehicle data so they never go
// stale; all other FAQs are admin-managed in the faqs table.
function buildBusComputedFaqs(buses: Vehicle[]): FaqItem[] {
  const pricingAnswer = buses
    .map(
      (bus) =>
        `The ${bus.name} is $${bus.pricePerHour} per hour for up to ${bus.capacity} guests with a ${bus.minimumHours}-hour minimum`
    )
    .join(". ");
  const maxCapacity = Math.max(...buses.map((bus) => bus.capacity), 0);

  return [
    {
      question: "How much does an executive bus rental cost in Austin?",
      answer: `${pricingAnswer}. A fuel charge may apply, and exact totals are shown before checkout based on your trip length.`
    },
    {
      question: "How many guests can ride?",
      answer: `Capacity depends on the vehicle. The current Austin bus fleet supports private groups up to ${maxCapacity} guests, with details listed on each vehicle page.`
    }
  ];
}

export default async function BusesPage() {
  const [vehicles, dbFaqs] = await Promise.all([getVehicles(), getPublishedFaqs(["buses", "general"])]);
  const buses = vehicles.filter((vehicle) => vehicle.type === "party-bus");
  const computedFaqs = buildBusComputedFaqs(buses);
  const faqJsonLdItems: FaqItem[] = [
    ...computedFaqs,
    ...dbFaqs.map((faq) => ({ question: faq.question, answer: stripHtml(faq.answerHtml) }))
  ];

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Bus Rentals", path: "/buses" }
          ]),
          buildVehicleItemListJsonLd("Austin executive bus and motorcoach rentals", buses, "/buses"),
          buildFaqJsonLd(faqJsonLdItems)
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Austin Bus Rentals</p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Austin executive bus rentals and corporate motorcoach charters
          </h1>
          <p className="text-lg text-neutral-300">
            Choose a premium executive coach or shuttle for corporate offsites, client appreciation events,
            and executive group transportation across Austin and throughout Texas — including Dallas, Fort
            Worth, San Antonio, Houston, and the Hill Country.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {buses.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {computedFaqs.map((faq) => (
            <FaqCard key={faq.question} question={faq.question} answerHtml={`<p>${faq.answer}</p>`} />
          ))}
          {dbFaqs.map((faq) => (
            <FaqCard key={faq.id} question={faq.question} answerHtml={faq.answerHtml} href={`/faq/${faq.slug}`} />
          ))}
        </div>

        <p className="mt-8 text-sm font-semibold">
          <Link href="/faq" className="text-emerald-400 transition-colors hover:text-emerald-300">
            See all frequently asked questions &rarr;
          </Link>
        </p>
      </section>
    </>
  );
}
