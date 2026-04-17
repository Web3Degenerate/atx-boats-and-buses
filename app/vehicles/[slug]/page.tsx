import Container from "@/components/ui/Container";
import ImageCarouselAnimated from "@/components/vehicles/ImageCarouselAnimated";
import UnifiedBookingForm from "@/components/booking/UnifiedBookingForm";
import { vehicles as staticVehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import { Vehicle } from "@/types";

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
  "/images/Luxury_Bus_1/Provost_mar_15_2026/21bus-21.webp",
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
  "/images/36-foot-slider-images/IMG_1968-card.webp",
];

const COBALT_IMAGES = [
  "/images/cobalt-boat/cobalt1.png",
  "/images/cobalt-boat/cobalt2.jpg",
  "/images/cobalt-boat/cobalt3.jpeg",
  "/images/cobalt-boat/cobalt4.jpeg",
  "/images/cobalt-boat/cobalt5.jpeg",
  "/images/cobalt-boat/cobalt6.jpeg",
  "/images/cobalt-boat/cobalt7.jpeg",
];

type VehicleRow = {
  id: string;
  name: string;
  slug: string;
  type: Vehicle["type"];
  description: string;
  capacity: number;
  price_per_hour: number;
  minimum_hours: number;
  maximum_hours: number;
  fuel_charge_percent: number;
  optional_charge_label: string;
  features: string[] | string;
  images: string[] | string;
};

function parseJsonArray(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function VehicleDetailPage({ params }: PageProps) {
  const result = await query<VehicleRow>(
    `
      SELECT id, name, slug, type, description, capacity, price_per_hour, minimum_hours, maximum_hours, fuel_charge_percent, optional_charge_label, features, images
      FROM vehicles
      WHERE slug = $1
      LIMIT 1
    `,
    [params.slug]
  );

  const row = result.rows[0];

  if (!row) {
    return (
      <section className="py-12">
        <Container>
          <p className="text-sm text-red-400">Vehicle not found.</p>
        </Container>
      </section>
    );
  }

  const staticVehicle = staticVehicles.find((item) => item.slug === row.slug);
  const vehicle: Vehicle = {
    id: staticVehicle?.id || row.slug,
    name: row.name,
    slug: row.slug,
    type: row.type,
    description: row.description,
    capacity: row.capacity,
    pricePerHour: row.price_per_hour / 100,
    minimumHours: row.minimum_hours,
    maximumHours: row.maximum_hours,
    fuelChargePercent: row.fuel_charge_percent,
    optionalChargeLabel: row.optional_charge_label || staticVehicle?.optionalChargeLabel || "Fuel Charge",
    features: parseJsonArray(row.features),
    images: parseJsonArray(row.images)
  };

  const dbVehicleId = row.id;
  const couponResult = await query<{
    id: string;
    code: string;
    discount_percent: number;
    valid_from: string;
    valid_to: string;
    promo_text: string | null;
  }>(
    `SELECT id, code, discount_percent, valid_from::text, valid_to::text, promo_text FROM coupons
     WHERE auto_apply = TRUE AND active = TRUE
       AND valid_from <= CURRENT_DATE AND valid_to >= CURRENT_DATE
       AND (vehicle_id = $1 OR vehicle_id IS NULL)
     ORDER BY (vehicle_id IS NOT NULL) DESC, created_at DESC
     LIMIT 1`,
    [dbVehicleId]
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

  return (
    <section className="py-12">
      <Container className="space-y-8">
        <ImageCarouselAnimated
          images={
            vehicle.slug === "prevost-tour-bus"
              ? PREVOST_IMAGES
              : vehicle.slug === "executive-shuttle"
                ? EXECUTIVE_SHUTTLE_IMAGES
                : vehicle.slug === "cobalt-boat"
                  ? COBALT_IMAGES
                  : vehicle.images
          }
          alt={vehicle.name}
        />

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">{vehicle.name}</h1>
          <p className="text-neutral-300">{vehicle.description}</p>
          <p className="text-neutral-200">
            <span className="font-semibold">Capacity:</span> Up to {vehicle.capacity} guests
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

          <UnifiedBookingForm vehicle={vehicle} autoApplyCoupon={autoApplyCoupon} />
        </div>
      </Container>
    </section>
  );
}
