import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import FaqCard from "@/components/faq/FaqCard";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildMetadata } from "@/lib/seo";
import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS, getPublishedFaqs, stripHtml } from "@/lib/faqs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Austin Boat Charter & Executive Bus Rental FAQs",
  description:
    "Answers to common questions about corporate boat charters on Lake Austin and Lake Travis and executive bus rentals in Austin — pricing, deposits, waivers, and trip planning.",
  path: "/faq"
});

export default async function FaqPage() {
  const faqs = await getPublishedFaqs();

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" }
          ]),
          buildFaqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: stripHtml(faq.answerHtml) })))
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">FAQ</p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Frequently asked questions about Austin boat charters and executive bus rentals
          </h1>
          <p className="text-lg text-neutral-300">
            Everything you need to know about booking a corporate boat charter or executive bus with ATX
            Boats &amp; Buses — and if your question is not answered here,{" "}
            <Link href="/contact" className="text-emerald-400 underline">
              contact us
            </Link>
            .
          </p>
        </div>

        {FAQ_CATEGORIES.map((category) => {
          const categoryFaqs = faqs.filter((faq) => faq.category === category);

          if (categoryFaqs.length === 0) {
            return null;
          }

          return (
            <div key={category} className="mt-12 first:mt-0">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">
                {FAQ_CATEGORY_LABELS[category]}
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {categoryFaqs.map((faq) => (
                  <FaqCard
                    key={faq.id}
                    question={faq.question}
                    answerHtml={faq.answerHtml}
                    href={`/faq/${faq.slug}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
