"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const data = (await response.json()) as { token?: string; error?: string };

      if (!response.ok || !data.token) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      window.localStorage.setItem("admin_token", data.token);
      router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-primary">Admin Login</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
