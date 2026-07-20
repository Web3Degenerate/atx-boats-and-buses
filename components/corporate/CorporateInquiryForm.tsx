"use client";

import { FormEvent, useState } from "react";

const EVENT_TYPES = [
  "Client appreciation",
  "Team offsite",
  "Conference transportation",
  "Executive travel",
  "Other"
];

const VEHICLE_INTERESTS = ["Boat charter", "Executive bus", "Both", "Not sure yet"];

const inputClass =
  "w-full rounded-md border border-white/10 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-400 focus:outline-none";

export default function CorporateInquiryForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [headcount, setHeadcount] = useState("");
  const [dates, setDates] = useState("");
  const [vehicleInterest, setVehicleInterest] = useState(VEHICLE_INTERESTS[3]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/corporate-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, company, email, phone, eventType, headcount, dates, vehicleInterest, notes })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "Unable to send your inquiry. Please try again or call us.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to send your inquiry. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Inquiry received</h2>
        <p className="mt-3 text-neutral-300">
          Thank you — our team will reach out within one business day to plan your event.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Your Name *</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Company *</span>
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} required className={inputClass} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Work Email *</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Phone</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Event Type</span>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputClass}>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Approximate Headcount</span>
          <input
            type="text"
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
            placeholder="e.g. 18"
            className={inputClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Preferred Date(s)</span>
          <input
            type="text"
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            placeholder="e.g. mid-September, flexible"
            className={inputClass}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Interested In</span>
          <select value={vehicleInterest} onChange={(e) => setVehicleInterest(e.target.value)} className={inputClass}>
            {VEHICLE_INTERESTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-neutral-300">Tell us about the event</span>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Occasion, itinerary ideas, budget range — anything that helps us plan."
          className={inputClass}
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {submitting ? "Sending..." : "Request a Proposal"}
      </button>
    </form>
  );
}
