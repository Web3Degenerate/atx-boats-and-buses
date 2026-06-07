import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { buildBreadcrumbJsonLd, buildMetadata, buildVehicleItemListJsonLd } from "@/lib/seo";
import { getVehicles } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Austin Party Bus Rentals & Executive Shuttles",
  description:
    "Rent a party bus or executive shuttle in Austin for weddings, corporate events, bachelor and bachelorette parties, concerts, and city tours.",
  path: "/buses",
  image: "/images/bus-slider-image-default.webp"
});

export default async function BusesPage() {
  const vehicles = await getVehicles();
  const buses = vehicles.filter((vehicle) => vehicle.type === "party-bus");

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Bus Rentals", path: "/buses" }
          ]),
          buildVehicleItemListJsonLd("Austin party bus and executive shuttle rentals", buses, "/buses")
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Austin Bus Rentals</p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Austin party bus rentals and executive shuttles
          </h1>
          <p className="text-lg text-neutral-300">
            Choose a premium bus or shuttle for weddings, corporate transportation, bachelor and bachelorette
            parties, concerts, game days, wine tours, and private Austin city events.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {buses.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold text-white">What bus rentals are available in Austin?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              ATX Boats & Buses offers premium group transportation including a Prevost tour bus and an
              executive shuttle for Austin events that need comfortable, private transportation.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold text-white">What events are party buses best for?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Party buses work well for wedding parties, bachelor and bachelorette groups, concerts, corporate
              outings, sporting events, winery trips, and downtown Austin celebrations.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold text-white">How many guests can ride?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Capacity depends on the vehicle. The current Austin bus fleet supports private groups up to 25
              guests, with details listed on each vehicle page.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
