"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BannedEmailRow = {
  id: string;
  email: string;
  reason: string | null;
  created_at: string;
};

export default function AdminBannedPage() {
  const router = useRouter();
  const [items, setItems] = useState<BannedEmailRow[]>([]);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchBannedEmails() {
    const response = await fetch("/api/admin/banned");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as BannedEmailRow[];
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchBannedEmails();
  }, [router]);

  async function handleBanEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await fetch("/api/admin/banned", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, reason })
    });

    setEmail("");
    setReason("");
    await fetchBannedEmails();
  }

  async function handleAllowEmail(id: string) {
    await fetch(`/api/admin/banned/${id}`, {
      method: "DELETE"
    });

    await fetchBannedEmails();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleBanEmail} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-primary">Ban Customer Email</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Email</span>
            <input
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Reason</span>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
            />
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
          Ban Email
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-900">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Email</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Reason</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Date Added</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2">{item.email}</td>
                <td className="px-3 py-2">{item.reason || "-"}</td>
                <td className="px-3 py-2">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleAllowEmail(item.id)}
                    className="rounded bg-neutral-700 px-2 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
                  >
                    Allow email address
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
