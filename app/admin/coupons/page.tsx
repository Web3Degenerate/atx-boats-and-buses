"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
  active: boolean;
  vehicle_id: string | null;
  vehicle_name: string | null;
  auto_apply: boolean;
  created_at: string;
  promo_text: string | null;
};

type AdminVehicle = {
  id: string;
  name: string;
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [autoApply, setAutoApply] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [adminVehicles, setAdminVehicles] = useState<AdminVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCoupons() {
    const response = await fetch("/api/admin/coupons");

    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }

    const data = (await response.json()) as CouponRow[];
    setCoupons(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCoupons();
  }, [router]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => setAdminVehicles(data));
  }, []);

  async function handleCreateCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        discountPercent: Number(discountPercent),
        validFrom,
        validTo,
        vehicleId,
        autoApply,
        promoText: promoText.trim() || null
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "Failed to create coupon.");
      return;
    }

    setCode("");
    setDiscountPercent("");
    setValidFrom("");
    setValidTo("");
    setVehicleId(null);
    setAutoApply(false);
    setPromoText("");
    await fetchCoupons();
  }

  async function handleToggleCoupon(coupon: CouponRow) {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ active: !coupon.active })
    });

    await fetchCoupons();
  }

  async function handleDeleteCoupon(id: string) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "DELETE"
    });

    await fetchCoupons();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreateCoupon} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-primary">Create Coupon</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-6">
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Code</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Discount %</span>
            <input
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Valid From</span>
            <input
              type="date"
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Valid To</span>
            <input
              type="date"
              value={validTo}
              onChange={(event) => setValidTo(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-slate-700">Vehicle</span>
            <select
              value={vehicleId ?? ""}
              onChange={(e) => setVehicleId(e.target.value || null)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
            >
              <option value="">All Vehicles</option>
              {adminVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">Auto-apply</span>
          </label>
        </div>
        <label className="mt-3 block space-y-1">
          <span className="text-sm text-slate-700">
            Promo Text{" "}
            <span className="text-slate-400">
              (optional — shown to customers on the vehicle page)
            </span>
          </span>
          <input
            type="text"
            value={promoText}
            onChange={(e) => setPromoText(e.target.value)}
            placeholder="e.g. 20% off on Weekday Rentals"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black"
          />
        </label>
        <button type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
          Create Coupon
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-900">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Code</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Discount %</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Valid From</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Valid To</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Vehicle</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Auto-apply</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Promo Text</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Active</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-3 py-2">{coupon.code}</td>
                <td className="px-3 py-2">{coupon.discount_percent}%</td>
                <td className="px-3 py-2">{coupon.valid_from}</td>
                <td className="px-3 py-2">{coupon.valid_to}</td>
                <td className="px-3 py-2">{coupon.vehicle_name ?? "All Vehicles"}</td>
                <td className="px-3 py-2">{coupon.auto_apply ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{coupon.promo_text ?? "—"}</td>
                <td className="px-3 py-2">{coupon.active ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCoupon(coupon)}
                      className="rounded bg-primary px-2 py-1 text-xs font-semibold text-white"
                    >
                      {coupon.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
