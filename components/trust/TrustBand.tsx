import { FileSignature, MapPin, ShieldCheck, UserCheck } from "lucide-react";

type TrustBandProps = {
  variant?: "full" | "compact";
};

const TRUST_ITEMS = [
  {
    icon: UserCheck,
    title: "Personally Confirmed",
    text: "Every charter request is reviewed and confirmed by our team — never an anonymous instant booking."
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    text: "Card details are handled end-to-end by Stripe. A hold is placed at request; you're only charged once we confirm."
  },
  {
    icon: FileSignature,
    title: "Digital Guest Waivers",
    text: "Every guest signs electronically before departure — no paperwork on the dock or curb."
  },
  {
    icon: MapPin,
    title: "Austin-Based, Statewide",
    text: "Lake Austin and Lake Travis charters, with executive coach service to Dallas, San Antonio, Houston, and the Hill Country."
  }
];

export default function TrustBand({ variant = "full" }: TrustBandProps) {
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-white/10 py-4">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-2 text-sm text-neutral-300">
            <item.icon className="h-4 w-4 text-emerald-400" />
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="border-y border-white/10 bg-neutral-900/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title}>
            <item.icon className="h-6 w-6 text-emerald-400" />
            <h3 className="mt-3 text-sm font-semibold uppercase tracking-wider text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-400">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
