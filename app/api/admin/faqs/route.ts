import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { FAQ_CATEGORIES, slugifyQuestion, type FaqCategory } from "@/lib/faqs";

type FaqPayload = {
  question?: string;
  answer_html?: string;
  category?: string;
  slug?: string;
  sort_order?: number;
  published?: boolean;
};

function validateFaqPayload(body: FaqPayload): { error: string } | null {
  if (!body.question?.trim() || !body.answer_html?.trim()) {
    return { error: "Question and answer are required" };
  }

  if (!FAQ_CATEGORIES.includes(body.category as FaqCategory)) {
    return { error: "Invalid category" };
  }

  return null;
}

export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT id, slug, question, answer_html, category, sort_order, published FROM faqs ORDER BY category, sort_order, created_at"
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as FaqPayload;
  const validationError = validateFaqPayload(body);

  if (validationError) {
    return NextResponse.json(validationError, { status: 400 });
  }

  const slug = slugifyQuestion(body.slug?.trim() || body.question!);

  if (!slug) {
    return NextResponse.json({ error: "Could not derive a slug from the question" }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO faqs (slug, question, answer_html, category, sort_order, published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [slug, body.question!.trim(), body.answer_html, body.category, body.sort_order ?? 0, body.published ?? true]
    );

    return NextResponse.json({ success: true, id: result.rows[0].id, slug });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
    }

    throw error;
  }
}
