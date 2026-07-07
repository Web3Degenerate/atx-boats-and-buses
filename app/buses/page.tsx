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
  title: "Austin Executive Bus Rentals & Corporate Motorcoach Charters",
  description:
    "Rent an executive bus or motorcoach in Austin for corporate offsites, client appreciation events, and executive group transportation.",
  path: "/buses",
  image: "/images/bus-slider-image-default.webp"
});

function buildBusFaqs(buses: Vehicle[]): FaqItem[] {
  const pricingAnswer = buses
    .map(
      (bus) =>
        `The ${bus.name} is $${bus.pricePerHour} per hour for up to ${bus.capacity} guests with a ${bus.minimumHours}-hour minimum`
    )
    .join(". ");
  const maxCapacity = Math.max(...buses.map((bus) => bus.capacity), 0);

  return [
    {
      question: "What bus rentals are available in Austin?",
      answer:
        "ATX Boats & Buses offers premium executive group transportation including a Prevost motorcoach and an executive shuttle for Austin corporate events that need comfortable, private transportation."
    },
    {
      question: "How much does an executive bus rental cost in Austin?",
      answer: `${pricingAnswer}. A fuel charge may apply, and exact totals are shown before checkout based on your trip length.`
    },
    {
      question: "How many guests can ride?",
      answer: `Capacity depends on the vehicle. The current Austin bus fleet supports private groups up to ${maxCapacity} guests, with details listed on each vehicle page.`
    },
    {
      question: "What events are executive bus rentals best for?",
      answer:
        "Executive bus rentals work well for corporate offsites, client appreciation events, executive retreats, business conferences, and downtown Austin corporate transportation."
    },
    {
      question: "Can the executive bus travel outside Austin?",
      answer:
        "Yes. Both the Prevost motorcoach and Executive Shuttle are available for statewide corporate travel, including conferences and business trips to Dallas, Fort Worth, San Antonio, and Houston, as well as Hill Country visits."
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

export default async function BusesPage() {
  const vehicles = await getVehicles();
  const buses = vehicles.filter((vehicle) => vehicle.type === "party-bus");
  const faqs = buildBusFaqs(buses);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Bus Rentals", path: "/buses" }
          ]),
          buildVehicleItemListJsonLd("Austin executive bus and motorcoach rentals", buses, "/buses"),
          buildFaqJsonLd(faqs)
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
