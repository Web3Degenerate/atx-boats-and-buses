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
  title: "Austin Corporate Boat Charters & Lake Travis Executive Yacht Rentals",
  description:
    "Charter a private boat or yacht in Austin for corporate offsites and client appreciation events on Lake Austin and Lake Travis.",
  path: "/boats",
  image: "/images/boat-slider-image-default.webp"
});

// Pricing stays computed from live vehicle data so it never goes stale;
// all other FAQs are admin-managed in the faqs table.
function buildBoatPricingFaq(boats: Vehicle[]): FaqItem {
  const pricingAnswer = boats
    .map(
      (boat) =>
        `The ${boat.name} is $${boat.pricePerHour} per hour for up to ${boat.capacity} guests with a ${boat.minimumHours}-hour minimum`
    )
    .join(". ");

  return {
    question: "How much does a corporate boat charter cost in Austin?",
    answer: `${pricingAnswer}. Exact totals are shown before checkout based on your trip length.`
  };
}

export default async function BoatsPage() {
  const [vehicles, dbFaqs] = await Promise.all([getVehicles(), getPublishedFaqs(["boats", "general"])]);
  const boats = vehicles.filter((vehicle) => vehicle.type === "party-boat");
  const pricingFaq = buildBoatPricingFaq(boats);
  const faqJsonLdItems: FaqItem[] = [
    pricingFaq,
    ...dbFaqs.map((faq) => ({ question: faq.question, answer: stripHtml(faq.answerHtml) }))
  ];

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Boat Rentals", path: "/boats" }
          ]),
          buildVehicleItemListJsonLd("Austin boat and yacht rentals", boats, "/boats"),
          buildFaqJsonLd(faqJsonLdItems)
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Austin Boat Rentals</p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Corporate boat charters and Lake Travis executive yacht rentals
          </h1>
          <p className="text-lg text-neutral-300">
            Charter a private boat or yacht for Austin corporate offsites, client appreciation events, and
            executive team outings on Lake Austin and Lake Travis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {boats.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <FaqCard question={pricingFaq.question} answerHtml={`<p>${pricingFaq.answer}</p>`} />
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
