"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

type SignerRow = {
  id: string;
  signer_type: "adult" | "guardian";
  first_name: string;
  last_name: string;
  email: string;
  signed_at: string;
  minors: Array<{
    first_name: string;
    last_name: string;
  }>;
};

type WaiverBookingRow = {
  id: string;
  vehicle_name: string;
  customer_name: string;
  customer_email: string;
  trip_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  waiver_token: string | null;
  signers: SignerRow[];
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getStatusMeta(signedCount: number, guestCount: number) {
  if (signedCount === 0) {
    return {
      label: "None",
      className: "bg-red-100 text-red-700"
    };
  }

  if (signedCount >= guestCount) {
    return {
      label: "Complete",
      className: "bg-emerald-100 text-emerald-700"
    };
  }

  return {
    label: "Partial",
    className: "bg-amber-100 text-amber-700"
  };
}

export default function AdminWaiversPage() {
  const router = useRouter();
  const [rows, setRows] = useState<WaiverBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState<string[]>([]);
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);
  const [generatingBookingId, setGeneratingBookingId] = useState<string | null>(null);

  async function generateWaiverLink(bookingId: string) {
    setGeneratingBookingId(bookingId);
    try {
      const response = await fetch("/api/admin/waivers/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bookingId })
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        window.alert(data?.error || "Failed to generate waiver link.");
        return;
      }

      await fetchWaivers();
    } finally {
      setGeneratingBookingId(null);
    }
  }

  async function copyWaiverLink(bookingId: string, token: string) {
    const url = `${window.location.origin}/waiver/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedBookingId(bookingId);
      setTimeout(() => {
        setCopiedBookingId((current) => (current === bookingId ? null : current));
      }, 2000);
    } catch {
      window.prompt("Copy waiver link:", url);
    }
  }

  async function fetchWaivers() {
    const response = await fetch("/api/admin/waivers");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as WaiverBookingRow[];
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchWaivers();
  }, [router]);

  function toggleExpanded(id: string) {
    setExpandedBookings((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-900">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-12 px-3 py-2 text-left font-semibold text-slate-900"></th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Vehicle</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Customer</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Trip Date</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Time</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Guests</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Waivers</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Waiver Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const isExpanded = expandedBookings.includes(row.id);
              const status = getStatusMeta(row.signers.length, row.guest_count);

              return (
                <Fragment key={row.id}>
                  <tr
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => toggleExpanded(row.id)}
                  >
                    <td className="px-3 py-3 text-slate-500">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </td>
                    <td className="px-3 py-3">{row.vehicle_name}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{row.customer_name}</div>
                      <div className="text-xs text-slate-500">{row.customer_email}</div>
                    </td>
                    <td className="px-3 py-3">{row.trip_date}</td>
                    <td className="px-3 py-3">
                      {formatTime(row.start_time)} - {formatTime(row.end_time)}
                    </td>
                    <td className="px-3 py-3">{row.guest_count}</td>
                    <td className="px-3 py-3">
                      {row.signers.length} / {row.guest_count} signed
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {row.waiver_token ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyWaiverLink(row.id, row.waiver_token!);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {copiedBookingId === row.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy link
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            generateWaiverLink(row.id);
                          }}
                          disabled={generatingBookingId !== null}
                          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
                        >
                          {generatingBookingId === row.id ? "Generating..." : "Generate link"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={9} className="px-4 py-4">
                        {row.signers.length === 0 ? (
                          <p className="text-sm text-slate-500">No signed waivers yet for this booking.</p>
                        ) : (
                          <div className="space-y-3">
                            {row.signers.map((signer) => (
                              <div key={signer.id} className="rounded-lg border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-slate-900">
                                        {signer.first_name} {signer.last_name}
                                      </p>
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                          signer.signer_type === "guardian"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-sky-100 text-sky-700"
                                        }`}
                                      >
                                        {signer.signer_type === "guardian" ? "Guardian" : "Adult"}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">{signer.email}</p>
                                    <p className="mt-1 text-xs text-slate-500">Signed {formatDateTime(signer.signed_at)}</p>
                                    {signer.signer_type === "guardian" && signer.minors.length > 0 && (
                                      <p className="mt-2 text-sm text-slate-600">
                                        Guardian for: {signer.minors.map((minor) => `${minor.first_name} ${minor.last_name}`).join(", ")}
                                      </p>
                                    )}
                                  </div>
                                  <a
                                    href={`/api/admin/waivers/pdf/${signer.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                  >
                                    Download PDF
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
