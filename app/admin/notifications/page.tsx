"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/notification-settings");

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = (await response.json()) as { recipients?: string };
      setRecipients(data.recipients || "");
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/notification-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recipients })
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage({ tone: "error", text: data.error || "Failed to save." });
        return;
      }

      setMessage({ tone: "success", text: "Notification recipients saved." });
    } catch {
      setMessage({ tone: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Booking Notifications</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every new booking request sends an alert (with a one-click approve/decline link) to each address below,
          comma-separated. To receive alerts as a text message, add your carrier&apos;s email-to-SMS address — e.g.{" "}
          <code className="rounded bg-slate-200 px-1">5125551234@vtext.com</code> (Verizon),{" "}
          <code className="rounded bg-slate-200 px-1">@txt.att.net</code> (AT&amp;T),{" "}
          <code className="rounded bg-slate-200 px-1">@tmomail.net</code> (T-Mobile).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={recipients}
          onChange={(event) => setRecipients(event.target.value)}
          placeholder="brett@atxboatsandbuses.com, 5125551234@vtext.com"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        <p className="text-xs text-slate-500">
          If this list is empty, alerts fall back to the ADMIN_ALERT_EMAIL environment variable.
        </p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Recipients"}
        </button>
        {message && (
          <p className={`text-sm ${message.tone === "success" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
        )}
      </form>
    </div>
  );
}
