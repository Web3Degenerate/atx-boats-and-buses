"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@tinymce/tinymce-react";

type WaiverTemplateRow = {
  id: string;
  vehicle_type: string;
  title: string;
  body: string;
  updated_at: string;
};

const TAB_ORDER = ["party-boat", "party-bus"];

const TAB_LABELS: Record<string, string> = {
  "party-boat": "Boat Waiver",
  "party-bus": "Bus Waiver"
};

export default function AdminWaiverTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WaiverTemplateRow[]>([]);
  const [activeVehicleType, setActiveVehicleType] = useState("party-boat");
  const [loading, setLoading] = useState(true);
  const [savingVehicleType, setSavingVehicleType] = useState<string | null>(null);
  const [savedVehicleType, setSavedVehicleType] = useState<string | null>(null);
  const [previewVehicleType, setPreviewVehicleType] = useState<string | null>(null);

  async function fetchTemplates() {
    const response = await fetch("/api/admin/waiver-templates");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as WaiverTemplateRow[];
    setTemplates(data);

    if (data[0] && !data.some((template) => template.vehicle_type === activeVehicleType)) {
      setActiveVehicleType(data[0].vehicle_type);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchTemplates();
  }, [router]);

  const orderedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const aIndex = TAB_ORDER.indexOf(a.vehicle_type);
      const bIndex = TAB_ORDER.indexOf(b.vehicle_type);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }, [templates]);

  const activeTemplate = orderedTemplates.find((template) => template.vehicle_type === activeVehicleType) || orderedTemplates[0];
  const previewTemplate = orderedTemplates.find((template) => template.vehicle_type === previewVehicleType) || null;

  function updateTemplate(vehicleType: string, key: "title" | "body", value: string) {
    setTemplates((current) =>
      current.map((template) =>
        template.vehicle_type === vehicleType ? { ...template, [key]: value } : template
      )
    );
  }

  async function handleSave(template: WaiverTemplateRow) {
    setSavingVehicleType(template.vehicle_type);

    const response = await fetch(`/api/admin/waiver-templates/${template.vehicle_type}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: template.title,
        body: template.body
      })
    });

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    if (response.ok) {
      const updated = (await response.json()) as WaiverTemplateRow;
      setTemplates((current) =>
        current.map((template) =>
          template.vehicle_type === updated.vehicle_type ? updated : template
        )
      );
      setSavedVehicleType(template.vehicle_type);
      window.setTimeout(() => {
        setSavedVehicleType((current) => (current === template.vehicle_type ? null : current));
      }, 2000);
    }

    setSavingVehicleType(null);
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  if (!activeTemplate) {
    return <p className="text-sm text-slate-600">No waiver templates found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {orderedTemplates.map((template) => (
          <button
            key={template.vehicle_type}
            type="button"
            onClick={() => setActiveVehicleType(template.vehicle_type)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTemplate.vehicle_type === template.vehicle_type
                ? "bg-primary text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {TAB_LABELS[template.vehicle_type] || template.vehicle_type}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-primary">
          {TAB_LABELS[activeTemplate.vehicle_type] || activeTemplate.vehicle_type}
        </h2>

        <div className="mt-4 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm text-slate-700">Title</span>
            <input
              type="text"
              value={activeTemplate.title}
              onChange={(event) => updateTemplate(activeTemplate.vehicle_type, "title", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
            />
          </label>

          <div className="space-y-1">
            <span className="text-sm text-slate-700">Waiver Body</span>
            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              value={activeTemplate.body}
              onEditorChange={(value: string) => updateTemplate(activeTemplate.vehicle_type, "body", value)}
              init={{
                height: 420,
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
              onClick={() => handleSave(activeTemplate)}
              disabled={savingVehicleType === activeTemplate.vehicle_type}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {savingVehicleType === activeTemplate.vehicle_type ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setPreviewVehicleType(activeTemplate.vehicle_type)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Preview
            </button>
            {savedVehicleType === activeTemplate.vehicle_type && (
              <p className="text-sm font-medium text-green-600">Saved!</p>
            )}
          </div>
        </div>
      </section>

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{previewTemplate.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {TAB_LABELS[previewTemplate.vehicle_type] || previewTemplate.vehicle_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVehicleType(null)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div
              className="prose mt-6 max-w-none prose-slate"
              dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
