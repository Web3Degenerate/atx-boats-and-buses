"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@tinymce/tinymce-react";

type EmailTemplateRow = {
  id: string;
  subject: string;
  html_body: string;
};

const TEMPLATE_LABELS: Record<string, string> = {
  booking_confirmed_deposit: "Booking Confirmed (Deposit)",
  booking_confirmed_full: "Booking Confirmed (Full Payment)",
  booking_cancelled_refund: "Booking Cancelled (Refund)",
  booking_cancelled_no_refund: "Booking Cancelled (No Refund)"
};

const TEMPLATE_VARIABLES = [
  "{{customerName}}",
  "{{vehicleName}}",
  "{{date}}",
  "{{startTime}}",
  "{{endTime}}",
  "{{depositAmount}}",
  "{{remainingAmount}}",
  "{{totalAmount}}"
];

export default function AdminEmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function fetchTemplates() {
    const response = await fetch("/api/admin/email-templates");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as EmailTemplateRow[];
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchTemplates();
  }, [router]);

  function updateTemplate(id: string, key: keyof EmailTemplateRow, value: string) {
    setTemplates((prev) => prev.map((template) => (template.id === id ? { ...template, [key]: value } : template)));
  }

  async function handleSave(template: EmailTemplateRow) {
    setSavingId(template.id);

    const response = await fetch(`/api/admin/email-templates/${template.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject: template.subject,
        html_body: template.html_body
      })
    });

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    if (response.ok) {
      setSavedId(template.id);
      window.setTimeout(() => {
        setSavedId((current) => (current === template.id ? null : current));
      }, 2000);
    }

    setSavingId(null);
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {templates.map((template) => (
        <section key={template.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-primary">{TEMPLATE_LABELS[template.id] || template.id}</h2>
          <div className="mt-4 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-slate-700">Subject</span>
              <input
                type="text"
                value={template.subject}
                onChange={(event) => updateTemplate(template.id, "subject", event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              />
            </label>

            <div className="space-y-1">
              <span className="text-sm text-slate-700">HTML Body</span>
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEE}
                value={template.html_body}
                onEditorChange={(value: string) => updateTemplate(template.id, "html_body", value)}
                init={{
                  height: 360,
                  menubar: false,
                  plugins: "lists link",
                  toolbar:
                    "bold italic underline | blocks | bullist numlist | link | forecolor backcolor | removeformat"
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave(template)}
                disabled={savingId === template.id}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {savingId === template.id ? "Saving..." : "Save"}
              </button>
              {savedId === template.id && <p className="text-sm font-medium text-green-600">Saved!</p>}
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Available variables</p>
              <p className="mt-2">{TEMPLATE_VARIABLES.join(", ")}</p>
              <p className="mt-2 text-xs text-slate-500">
                These will be replaced with real booking data when the email is sent.
              </p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
