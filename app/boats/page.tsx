import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { buildBreadcrumbJsonLd, buildMetadata, buildVehicleItemListJsonLd } from "@/lib/seo";
import { getVehicles } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Austin Boat Rentals, Lake Austin Boats & Lake Travis Yacht Charters",
  description:
    "Rent a boat or yacht in Austin for Lake Austin and Lake Travis birthdays, bachelor and bachelorette parties, sunset cruises, and private lake days.",
  path: "/boats",
  image: "/images/boat-slider-image-default.webp"
});

export default async function BoatsPage() {
  const vehicles = await getVehicles();
  const boats = vehicles.filter((vehicle) => vehicle.type === "party-boat");

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Boat Rentals", path: "/boats" }
          ]),
          buildVehicleItemListJsonLd("Austin boat and yacht rentals", boats, "/boats")
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Austin Boat Rentals</p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Lake Austin boat rentals and Lake Travis yacht charters
          </h1>
          <p className="text-lg text-neutral-300">
            Book a private boat or yacht for Austin lake days, birthdays, sunset cruises, bachelor and
            bachelorette parties, corporate outings, and relaxed celebrations on the water.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {boats.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold text-white">Where can I rent a boat in Austin?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              ATX Boats & Buses offers private boat rental options for Austin lake trips, including outings on
              Lake Austin and Lake Travis depending on the selected vessel and booking details.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold text-white">What boat rental options are available?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              The current fleet includes a Cobalt boat for smaller groups and a Carver yacht for larger private
              lake events, with capacity and minimum hours listed on each vehicle page.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
            <h2 className="text-xl font-semibold text-white">What events are boat rentals best for?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Boat and yacht rentals are a fit for birthdays, bachelor and bachelorette parties, corporate lake
              days, family outings, sunset cruises, and private celebrations around Austin.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
