"use client";

import { FormEvent, useState } from "react";

type ContactResponse = {
  success?: boolean;
  error?: string;
};

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, phone, message })
      });

      const data = (await response.json()) as ContactResponse;

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to send message");
        setSubmitting(false);
        return;
      }

      setSuccessMessage("Message sent successfully. We will get back to you soon.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to send message");
      setSubmitting(false);
    }
  }

  return (
    <section className="py-12">
      <div className="mx-auto w-full max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-white">Contact Us</h1>
        <p className="mt-2 text-neutral-300">Have questions about booking? Give us a call or send us a message.</p>

        <div className="mt-6 rounded-xl border border-white/10 bg-neutral-900 p-5">
          <h2 className="text-lg font-semibold text-white">Call Us</h2>
          <p className="mt-1 text-sm text-neutral-400">Speak with our team directly for fast booking help.</p>
          {/* TODO: Replace with real business phone number */}
          <a
            href="tel:+15125550199"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-4 text-lg font-semibold text-black transition hover:bg-neutral-200"
          >
            (512) 555-0199
          </a>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-white/10 bg-neutral-900 p-5">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-300">Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-300">Phone</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-300">Message</span>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white"
            />
          </label>

          {successMessage && <p className="text-sm text-green-700">{successMessage}</p>}
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}
