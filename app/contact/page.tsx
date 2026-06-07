import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import JsonLd from "@/components/seo/JsonLd";
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact ATX Boats & Buses",
  description:
    "Contact ATX Boats & Buses to plan Austin boat rentals, Lake Austin and Lake Travis trips, party bus rentals, and executive shuttle transportation.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd()} />
      <ContactForm />
    </>
  );
}
