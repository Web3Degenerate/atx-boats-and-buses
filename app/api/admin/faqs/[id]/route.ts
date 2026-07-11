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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as FaqPayload;

  if (!body.question?.trim() || !body.answer_html?.trim()) {
    return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
  }

  if (!FAQ_CATEGORIES.includes(body.category as FaqCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const slug = slugifyQuestion(body.slug?.trim() || body.question);

  if (!slug) {
    return NextResponse.json({ error: "Could not derive a slug from the question" }, { status: 400 });
  }

  try {
    const result = await query(
      `UPDATE faqs
       SET slug = $1, question = $2, answer_html = $3, category = $4, sort_order = $5, published = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id`,
      [slug, body.question.trim(), body.answer_html, body.category, body.sort_order ?? 0, body.published ?? true, params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
    }

    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query("DELETE FROM faqs WHERE id = $1 RETURNING id", [params.id]);

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
