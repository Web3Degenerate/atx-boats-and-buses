import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UnifiedBookingForm from "@/components/booking/UnifiedBookingForm";
import JsonLd from "@/components/seo/JsonLd";
import Container from "@/components/ui/Container";
import ImageCarouselAnimated from "@/components/vehicles/ImageCarouselAnimated";
import { query } from "@/lib/db";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildMetadata,
  buildVehicleServiceJsonLd,
  type FaqItem
} from "@/lib/seo";
import { getVehicleBySlug } from "@/lib/vehicles";
import type { Vehicle } from "@/types";

export const dynamic = "force-dynamic";

const PREVOST_IMAGES = [
  "/images/Luxury_Bus_1/Provost_mar_15_2026/1bus-1.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/2bus-2.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/3bus-3.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/4bus-4.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/5bus-5.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/6bus-6.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/7bus-7.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/8bus-8.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/9bus-9.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/10bus-10.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/11bus-11.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/12bus-12.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/13bus-13.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/14bus-14.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/15bus-15.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/16bus-16.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/17bus-17.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/18bus-18.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/19bus-19.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/20bus-20.webp",
  "/images/Luxury_Bus_1/Provost_mar_15_2026/21bus-21.webp"
];

const EXECUTIVE_SHUTTLE_IMAGES = [
  "/images/36-foot-slider-images/36bus-1-card.webp",
  "/images/36-foot-slider-images/36bus-2-card.webp",
  "/images/36-foot-slider-images/IMG_1939-card.webp",
  "/images/36-foot-slider-images/IMG_1942-card.webp",
  "/images/36-foot-slider-images/IMG_1943-card.webp",
  "/images/36-foot-slider-images/IMG_1944-card.webp",
  "/images/36-foot-slider-images/IMG_1945-card.webp",
  "/images/36-foot-slider-images/IMG_1946-card.webp",
  "/images/36-foot-slider-images/IMG_1947-card.webp",
  "/images/36-foot-slider-images/IMG_1948-card.webp",
  "/images/36-foot-slider-images/IMG_1949-card.webp",
  "/images/36-foot-slider-images/IMG_1953-card.webp",
  "/images/36-foot-slider-images/IMG_1954-card.webp",
  "/images/36-foot-slider-images/IMG_1955-card.webp",
  "/images/36-foot-slider-images/IMG_1959-card.webp",
  "/images/36-foot-slider-images/IMG_1960-card.webp",
  "/images/36-foot-slider-images/IMG_1961-card.webp",
  "/images/36-foot-slider-images/IMG_1963-card.webp",
  "/images/36-foot-slider-images/IMG_1964-card.webp",
  "/images/36-foot-slider-images/IMG_1965-card.webp",
  "/images/36-foot-slider-images/IMG_1966-card.webp",
  "/images/36-foot-slider-images/IMG_1967-card.webp",
  "/images/36-foot-slider-images/IMG_1968-card.webp"
];

const COBALT_IMAGES = [
  "/images/cobalt-boat/cobalt1.png",
  "/images/cobalt-boat/cobalt2.jpg",
  "/images/cobalt-boat/cobalt3.jpeg",
  "/images/cobalt-boat/cobalt4.jpeg",
  "/images/cobalt-boat/cobalt5.jpeg",
  "/images/cobalt-boat/cobalt6.jpeg",
  "/images/cobalt-boat/cobalt7.jpeg"
];

type PageProps = {
  params: {
    slug: string;
  };
};

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
  promo_text: string | null;
};

function getCategoryPath(vehicle: Vehicle): string {
  return vehicle.type === "party-bus" ? "/buses" : "/boats";
}

function getCategoryName(vehicle: Vehicle): string {
  return vehicle.type === "party-bus" ? "Bus Rentals" : "Boat Rentals";
}

function getCarouselImages(vehicle: Vehicle): string[] {
  if (vehicle.slug === "prevost-tour-bus") {
    return PREVOST_IMAGES;
  }

  if (vehicle.slug === "executive-shuttle") {
    return EXECUTIVE_SHUTTLE_IMAGES;
  }

  if (vehicle.slug === "cobalt-boat") {
    return COBALT_IMAGES;
  }

  return vehicle.images;
}

function getBestUseCases(vehicle: Vehicle): string {
  if (vehicle.type === "party-bus") {
    return "corporate offsites, client appreciation events, executive retreats, business conferences, and statewide corporate travel to Dallas, Fort Worth, San Antonio, and Houston";
  }

  return "Lake Austin and Lake Travis corporate offsites, client appreciation events, executive team outings, and business development days";
}

function buildVehicleFaqs(vehicle: Vehicle): FaqItem[] {
  const fuelChargeNote =
    vehicle.fuelChargePercent > 0
      ? ` A ${vehicle.fuelChargePercent}% ${vehicle.optionalChargeLabel.toLowerCase()} may apply.`
      : "";

  return [
    {
      question: `What is ${vehicle.name} best for?`,
      answer: `${vehicle.name} is a strong fit for ${getBestUseCases(vehicle)}.`
    },
    {
      question: `How much does ${vehicle.name} cost to rent?`,
      answer: `${vehicle.name} rents for $${vehicle.pricePerHour} per hour with a ${vehicle.minimumHours}-hour minimum.${fuelChargeNote} The exact total is shown before checkout based on your trip length.`
    },
    {
      question: "How many guests can it fit?",
      answer: `This rental accommodates up to ${vehicle.capacity} guests. For mixed age groups or special event needs, confirm the final guest count before booking.`
    },
    {
      question: "Where does it serve?",
      answer:
        "ATX Boats & Buses serves Austin, Lake Austin, Lake Travis, and Central Texas event groups depending on the selected rental and trip details."
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vehicle = await getVehicleBySlug(params.slug);

  if (!vehicle) {
    return buildMetadata({
      title: "Vehicle Not Found",
      description: "This ATX Boats & Buses rental vehicle could not be found.",
      path: `/vehicles/${params.slug}`,
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${vehicle.name} Rental in Austin`,
    description: `${vehicle.description} Book ${vehicle.name} for Austin corporate events, executive groups, and premium transportation or lake experiences.`,
    path: `/vehicles/${vehicle.slug}`,
    image: getCarouselImages(vehicle)[0] || "/images/boat-slider-image-default.webp"
  });
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const vehicle = await getVehicleBySlug(params.slug);

  if (!vehicle) {
    notFound();
  }

  const couponResult = await query<CouponRow>(
    `SELECT id, code, discount_percent, valid_from::text, valid_to::text, promo_text FROM coupons
     WHERE auto_apply = TRUE AND active = TRUE
       AND valid_from <= CURRENT_DATE AND valid_to >= CURRENT_DATE
       AND (vehicle_id = $1 OR vehicle_id IS NULL)
     ORDER BY (vehicle_id IS NOT NULL) DESC, created_at DESC
     LIMIT 1`,
    [vehicle.dbId]
  );
  const autoApplyCoupon = couponResult.rows[0]
    ? {
        id: couponResult.rows[0].id,
        code: couponResult.rows[0].code,
        discountPercent: couponResult.rows[0].discount_percent,
        validFrom: couponResult.rows[0].valid_from,
        validTo: couponResult.rows[0].valid_to,
        promoText: couponResult.rows[0].promo_text
      }
    : null;

  const faqs = buildVehicleFaqs(vehicle);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: getCategoryName(vehicle), path: getCategoryPath(vehicle) },
            { name: vehicle.name, path: `/vehicles/${vehicle.slug}` }
          ]),
          buildVehicleServiceJsonLd(vehicle),
          buildFaqJsonLd(faqs)
        ]}
      />
      <section className="py-12">
        <Container className="space-y-8">
          <ImageCarouselAnimated images={getCarouselImages(vehicle)} alt={vehicle.name} />

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              {vehicle.type === "party-bus" ? "Austin bus rental" : "Austin boat rental"}
            </p>
            <h1 className="text-3xl font-bold text-white">{vehicle.name}</h1>
            <p className="text-neutral-300">{vehicle.description}</p>
            <p className="text-neutral-200">
              <span className="font-semibold">Capacity:</span> Up to {vehicle.capacity} guests
            </p>
            <p className="text-neutral-200">
              <span className="font-semibold">Minimum rental:</span> {vehicle.minimumHours} hours
            </p>
            <p className="text-xl font-semibold text-emerald-400">${vehicle.pricePerHour} / hour</p>
            {autoApplyCoupon?.promoText && (
              <p className="text-sm font-medium text-emerald-400">{autoApplyCoupon.promoText}</p>
            )}

            <div>
              <h2 className="mb-2 text-lg font-semibold text-white">Features</h2>
              <ul className="list-inside list-disc space-y-1 text-neutral-300">
                {vehicle.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {faqs.map((faq) => (
                <article key={faq.question} className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
                  <h2 className="text-lg font-semibold text-white">{faq.question}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">{faq.answer}</p>
                </article>
              ))}
            </div>

            <UnifiedBookingForm vehicle={vehicle} autoApplyCoupon={autoApplyCoupon} />
          </div>
        </Container>
      </section>
    </>
  );
}
