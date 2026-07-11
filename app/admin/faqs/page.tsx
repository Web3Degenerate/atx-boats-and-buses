"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@tinymce/tinymce-react";

type FaqRow = {
  id: string;
  slug: string;
  question: string;
  answer_html: string;
  category: "boats" | "buses" | "general";
  sort_order: number;
  published: boolean;
};

type FaqDraft = Omit<FaqRow, "id"> & { id: string | null };

const CATEGORY_OPTIONS: { value: FaqRow["category"]; label: string }[] = [
  { value: "boats", label: "Boat Rentals" },
  { value: "buses", label: "Bus Rentals" },
  { value: "general", label: "General" }
];

const EMPTY_DRAFT: FaqDraft = {
  id: null,
  slug: "",
  question: "",
  answer_html: "",
  category: "general",
  sort_order: 0,
  published: true
};

function slugify(question: string): string {
  return question
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminFaqsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<FaqDraft | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchFaqs() {
    const response = await fetch("/api/admin/faqs");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as FaqRow[];
    setFaqs(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchFaqs();
  }, [router]);

  function startCreate() {
    setDraft({ ...EMPTY_DRAFT });
    setSlugEdited(false);
    setError(null);
  }

  function startEdit(faq: FaqRow) {
    setDraft({ ...faq });
    setSlugEdited(true);
    setError(null);
  }

  function updateDraft<K extends keyof FaqDraft>(key: K, value: FaqDraft[K]) {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }

      const next = { ...prev, [key]: value };

      if (key === "question" && !slugEdited) {
        next.slug = slugify(String(value));
      }

      return next;
    });
  }

  async function handleSave() {
    if (!draft) {
      return;
    }

    setSaving(true);
    setError(null);

    const response = await fetch(draft.id ? `/api/admin/faqs/${draft.id}` : "/api/admin/faqs", {
      method: draft.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: draft.question,
        answer_html: draft.answer_html,
        category: draft.category,
        slug: draft.slug,
        sort_order: draft.sort_order,
        published: draft.published
      })
    });

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    if (response.ok) {
      setDraft(null);
      await fetchFaqs();
    } else {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Failed to save FAQ");
    }

    setSaving(false);
  }

  async function handleDelete(faq: FaqRow) {
    if (!window.confirm(`Delete the FAQ "${faq.question}"? Its /faq/${faq.slug} page will stop existing.`)) {
      return;
    }

    const response = await fetch(`/api/admin/faqs/${faq.id}`, { method: "DELETE" });

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    if (response.ok) {
      await fetchFaqs();
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">FAQs</h2>
          <p className="mt-1 text-sm text-slate-600">
            Each FAQ becomes a Google-indexable page at /faq/&lt;slug&gt;. Phrase the question the way people
            search (e.g. &quot;Do Lake Austin boat rentals come with a captain?&quot;).
          </p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            New FAQ
          </button>
        )}
      </div>

      {draft && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-primary">{draft.id ? "Edit FAQ" : "New FAQ"}</h3>
          <div className="mt-4 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-slate-700">Question (targets the search phrase)</span>
              <input
                type="text"
                value={draft.question}
                onChange={(event) => updateDraft("question", event.target.value)}
                placeholder="Do Lake Austin boat rentals come with a captain?"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-slate-700">URL slug (atxboatsandbuses.com/faq/...)</span>
              <input
                type="text"
                value={draft.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  updateDraft("slug", event.target.value);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              />
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <label className="block space-y-1">
                <span className="text-sm text-slate-700">Category</span>
                <select
                  value={draft.category}
                  onChange={(event) => updateDraft("category", event.target.value as FaqRow["category"])}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm text-slate-700">Sort order</span>
                <input
                  type="number"
                  value={draft.sort_order}
                  onChange={(event) => updateDraft("sort_order", Number(event.target.value) || 0)}
                  className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
                />
              </label>

              <label className="flex items-center gap-2 pt-5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(event) => updateDraft("published", event.target.checked)}
                />
                Published
              </label>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-slate-700">Answer</span>
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                value={draft.answer_html}
                onEditorChange={(value: string) => updateDraft("answer_html", value)}
                init={{
                  height: 360,
                  menubar: false,
                  plugins: "lists link",
                  toolbar:
                    "bold italic underline | blocks | bullist numlist | link | forecolor backcolor | removeformat"
                }}
              />
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white">
        {faqs.length === 0 ? (
          <p className="p-4 text-sm text-slate-600">No FAQs yet. Create the first one.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {faqs.map((faq) => (
              <li key={faq.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{faq.question}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    /faq/{faq.slug} &middot; {CATEGORY_OPTIONS.find((option) => option.value === faq.category)?.label}{" "}
                    &middot; sort {faq.sort_order}
                    {!faq.published && <span className="ml-2 font-semibold text-amber-600">Unpublished</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <a
                    href={`/faq/${faq.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-primary"
                  >
                    View
                  </a>
                  <button type="button" onClick={() => startEdit(faq)} className="text-primary hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(faq)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
