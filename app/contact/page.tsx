import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with ATX Boats & Buses. Call or message us to plan your next Austin event."
};

export default function ContactPage() {
  return <ContactForm />;
}
