import Image from "next/image";
import { notFound } from "next/navigation";
import BookingForm from "@/components/booking/BookingForm";
import Container from "@/components/ui/Container";
import { vehicles } from "@/data/vehicles";

type VehicleDetailPageProps = {
  params: {
    slug: string;
  };
};

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const vehicle = vehicles.find((item) => item.slug === params.slug);

  if (!vehicle) {
    notFound();
  }

  return (
    <section className="py-12">
      <Container className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          {vehicle.images.map((image, index) => (
            <Image
              key={image}
              src={image}
              alt={`${vehicle.name} image ${index + 1}`}
              width={600}
              height={400}
              className="h-auto w-full rounded-xl object-cover"
            />
          ))}
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary">{vehicle.name}</h1>
          <p className="text-slate-700">{vehicle.description}</p>
          <p className="text-slate-800">
            <span className="font-semibold">Capacity:</span> Up to {vehicle.capacity} guests
          </p>
          <p className="text-xl font-semibold text-accent">${vehicle.pricePerHour} / hour</p>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-primary">Features</h2>
            <ul className="list-inside list-disc space-y-1 text-slate-700">
              {vehicle.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <BookingForm vehicle={vehicle} />
        </div>
      </Container>
    </section>
  );
}
