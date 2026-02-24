import Image from "next/image";
import Link from "next/link";
import { Vehicle } from "@/types";
import Button from "@/components/ui/Button";

type VehicleCardProps = {
  vehicle: Vehicle;
};

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-sm">
      <div className="relative h-48 w-full bg-neutral-800">
        <Image
          src={vehicle.images[0]}
          alt={vehicle.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
      </div>
      <div className="space-y-3 p-5">
        <h3 className="text-xl font-semibold text-white">{vehicle.name}</h3>
        <p className="text-sm text-neutral-400">{vehicle.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-200">Up to {vehicle.capacity} guests</span>
          <span className="font-semibold text-emerald-400">${vehicle.pricePerHour}/hr</span>
        </div>
        <Button href={`/vehicles/${vehicle.slug}`} className="w-full">
          View Details
        </Button>
      </div>
    </article>
  );
}
