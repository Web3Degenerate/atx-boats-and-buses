import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import FaqCard from "@/components/faq/FaqCard";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildMetadata } from "@/lib/seo";
import { getPublishedFaqBySlug, getPublishedFaqs, stripHtml } from "@/lib/faqs";

export const dynamic = "force-dynamic";

type FaqSlugPageProps = {
  params: { slug: string };
};

function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

export async function generateMetadata({ params }: FaqSlugPageProps): Promise<Metadata> {
  const faq = await getPublishedFaqBySlug(params.slug);

  if (!faq) {
    return buildMetadata({
      title: "FAQ",
      description: "Frequently asked questions about Austin boat charters and executive bus rentals.",
      path: "/faq",
      noIndex: true
    });
  }

  return buildMetadata({
    title: faq.question,
    description: truncateDescription(stripHtml(faq.answerHtml)),
    path: `/faq/${faq.slug}`
  });
}

export default async function FaqSlugPage({ params }: FaqSlugPageProps) {
  const faq = await getPublishedFaqBySlug(params.slug);

  if (!faq) {
    notFound();
  }

  const allFaqs = await getPublishedFaqs();
  const otherFaqs = allFaqs.filter((item) => item.id !== faq.id);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
            { name: faq.question, path: `/faq/${faq.slug}` }
          ]),
          buildFaqJsonLd(
            [faq, ...otherFaqs].map((item) => ({
              question: item.question,
              answer: stripHtml(item.answerHtml)
            }))
          )
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            <Link href="/faq" className="transition-colors hover:text-emerald-300">
              FAQ
            </Link>
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">{faq.question}</h1>
          <div
            className="mt-6 text-lg leading-8 text-neutral-300 [&_a]:text-emerald-400 [&_a]:underline [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p:not(:first-child)]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
          />
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href="/boats"
              className="rounded-full border border-emerald-400/40 px-5 py-2 text-emerald-400 transition-colors hover:bg-emerald-400/10"
            >
              View Boat Charters
            </Link>
            <Link
              href="/buses"
              className="rounded-full border border-emerald-400/40 px-5 py-2 text-emerald-400 transition-colors hover:bg-emerald-400/10"
            >
              View Bus Rentals
            </Link>
          </div>
        </div>

        {otherFaqs.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">More frequently asked questions</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {otherFaqs.map((item) => (
                <FaqCard
                  key={item.id}
                  question={item.question}
                  answerHtml={item.answerHtml}
                  href={`/faq/${item.slug}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
