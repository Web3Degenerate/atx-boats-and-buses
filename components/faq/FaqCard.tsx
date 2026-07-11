import Link from "next/link";

type FaqCardProps = {
  question: string;
  answerHtml: string;
  href?: string;
};

export default function FaqCard({ question, answerHtml, href }: FaqCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
      <h2 className="text-xl font-semibold text-white">
        {href ? (
          <Link href={href} className="transition-colors hover:text-emerald-400">
            {question}
          </Link>
        ) : (
          question
        )}
      </h2>
      <div
        className="mt-3 text-sm leading-6 text-neutral-300 [&_a]:text-emerald-400 [&_a]:underline [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p:not(:first-child)]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: answerHtml }}
      />
    </article>
  );
}
