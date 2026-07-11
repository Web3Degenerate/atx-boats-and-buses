import { query } from "@/lib/db";

export type FaqCategory = "boats" | "buses" | "general";

export const FAQ_CATEGORIES: FaqCategory[] = ["boats", "buses", "general"];

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  boats: "Boat Rentals",
  buses: "Bus Rentals",
  general: "General"
};

export type Faq = {
  id: string;
  slug: string;
  question: string;
  answerHtml: string;
  category: FaqCategory;
  sortOrder: number;
  published: boolean;
  updatedAt: Date;
};

type FaqRow = {
  id: string;
  slug: string;
  question: string;
  answer_html: string;
  category: FaqCategory;
  sort_order: number;
  published: boolean;
  updated_at: Date;
};

const FAQ_COLUMNS = "id, slug, question, answer_html, category, sort_order, published, updated_at";

function mapFaqRow(row: FaqRow): Faq {
  return {
    id: row.id,
    slug: row.slug,
    question: row.question,
    answerHtml: row.answer_html,
    category: row.category,
    sortOrder: row.sort_order,
    published: row.published,
    updatedAt: row.updated_at
  };
}

export async function getPublishedFaqs(categories?: FaqCategory[]): Promise<Faq[]> {
  const result = categories?.length
    ? await query<FaqRow>(
        `SELECT ${FAQ_COLUMNS} FROM faqs WHERE published = true AND category = ANY($1) ORDER BY category, sort_order, created_at`,
        [categories]
      )
    : await query<FaqRow>(
        `SELECT ${FAQ_COLUMNS} FROM faqs WHERE published = true ORDER BY category, sort_order, created_at`
      );

  return result.rows.map(mapFaqRow);
}

export async function getPublishedFaqBySlug(slug: string): Promise<Faq | null> {
  const result = await query<FaqRow>(
    `SELECT ${FAQ_COLUMNS} FROM faqs WHERE slug = $1 AND published = true LIMIT 1`,
    [slug]
  );

  return result.rows[0] ? mapFaqRow(result.rows[0]) : null;
}

export function slugifyQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// schema.org Answer.text and meta descriptions want plain text, not the TinyMCE HTML.
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
