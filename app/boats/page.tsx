import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import VehicleCard from "@/components/vehicles/VehicleCard";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildMetadata,
  buildVehicleItemListJsonLd,
  type FaqItem
} from "@/lib/seo";
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

function buildBoatFaqs(boats: Vehicle[]): FaqItem[] {
  const pricingAnswer = boats
    .map(
      (boat) =>
        `The ${boat.name} is $${boat.pricePerHour} per hour for up to ${boat.capacity} guests with a ${boat.minimumHours}-hour minimum`
    )
    .join(". ");

  return [
    {
      question: "Where can I charter a boat for a corporate event in Austin?",
      answer:
        "ATX Boats & Buses offers private boat charter options for Austin corporate outings, including trips on Lake Austin and Lake Travis depending on the selected vessel and event details."
    },
    {
      question: "How much does a corporate boat charter cost in Austin?",
      answer: `${pricingAnswer}. Exact totals are shown before checkout based on your trip length.`
    },
    {
      question: "What boat charter options are available?",
      answer:
        "The current fleet includes a Cobalt boat for smaller groups and a Carver yacht for larger private lake events, with capacity and minimum hours listed on each vehicle page."
    },
    {
      question: "What events are private boat charters best for?",
      answer:
        "Private boat charters are well suited for corporate offsites, client appreciation events, executive team outings, and business development days on the water around Austin."
    },
    {
      question: "How do deposits and payment work?",
      answer:
        "A 20% deposit confirms your booking, and the remaining balance is automatically charged to your card on file two days before the trip. Bookings made within two days of the trip are paid in full at checkout."
    },
    {
      question: "Do guests need to sign a waiver?",
      answer:
        "Yes. Every guest signs a digital waiver before the trip. You receive a shareable waiver link with your booking confirmation, plus reminders as your trip date approaches."
    }
  ];
}

export default async function BoatsPage() {
  const vehicles = await getVehicles();
  const boats = vehicles.filter((vehicle) => vehicle.type === "party-boat");
  const faqs = buildBoatFaqs(boats);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Boat Rentals", path: "/boats" }
          ]),
          buildVehicleItemListJsonLd("Austin boat and yacht rentals", boats, "/boats"),
          buildFaqJsonLd(faqs)
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
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
              <h2 className="text-xl font-semibold text-white">{faq.question}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
