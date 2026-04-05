"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

type WaiverSigningFormProps = {
  token: string;
  waiver: {
    body: string;
    booking: {
      id: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      date: string;
      startTime: string;
      endTime: string;
      status: string;
      vehicleType: string;
    };
    guest_count: number;
    signed_count: number;
  };
};

type AdultFormValues = {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  esign_consent: boolean;
};

type GuardianFormValues = Omit<AdultFormValues, "date_of_birth">;

type MinorFormValues = {
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
};

type FormErrors = Record<string, string>;

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const initialFormValues: AdultFormValues = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  esign_consent: false
};

const initialGuardianValues: GuardianFormValues = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  esign_consent: false
};

const initialMinorValues: MinorFormValues = {
  first_name: "",
  last_name: "",
  middle_name: "",
  date_of_birth: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: ""
};

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export default function WaiverSigningForm({ token, waiver }: WaiverSigningFormProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [signerMode, setSignerMode] = useState<"adult" | "guardian">("adult");
  const [values, setValues] = useState<AdultFormValues>(initialFormValues);
  const [guardianValues, setGuardianValues] = useState<GuardianFormValues>(initialGuardianValues);
  const [minorCount, setMinorCount] = useState(1);
  const [minorValues, setMinorValues] = useState<MinorFormValues[]>([initialMinorValues]);
  const [expandedMinors, setExpandedMinors] = useState<number[]>([0]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(waiver.signed_count);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const progressLabel = useMemo(
    () => `${submittedCount} of ${waiver.guest_count} guests have signed this waiver`,
    [submittedCount, waiver.guest_count]
  );

  function handleSignerModeChange(mode: "adult" | "guardian") {
    setSignerMode(mode);
    setErrors({});
    setSubmitError("");
    setIsSubmitted(false);
    clearSignature();
  }

  function updateValue<Key extends keyof AdultFormValues>(key: Key, value: AdultFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateGuardianValue<Key extends keyof GuardianFormValues>(key: Key, value: GuardianFormValues[Key]) {
    setGuardianValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`guardian.${key}`];
      return next;
    });
  }

  function updateMinorValue(index: number, key: keyof MinorFormValues, value: string) {
    setMinorValues((current) =>
      current.map((minor, minorIndex) => (minorIndex === index ? { ...minor, [key]: value } : minor))
    );
    setErrors((current) => {
      const next = { ...current };
      delete next[`minor.${index}.${key}`];
      return next;
    });
  }

  function handleMinorCountChange(count: number) {
    setMinorCount(count);
    setMinorValues((current) => {
      if (count > current.length) {
        return [...current, ...Array.from({ length: count - current.length }, () => ({ ...initialMinorValues }))];
      }
      return current.slice(0, count);
    });
    setExpandedMinors(Array.from({ length: count }, (_, index) => index));
  }

  function clearSignature() {
    signatureRef.current?.clear();
    setErrors((current) => {
      const next = { ...current };
      delete next.signature_data;
      return next;
    });
  }

  function resetForm() {
    setValues(initialFormValues);
    setGuardianValues(initialGuardianValues);
    setMinorCount(1);
    setMinorValues([{ ...initialMinorValues }]);
    setExpandedMinors([0]);
    setErrors({});
    setSubmitError("");
    setIsSubmitted(false);
    clearSignature();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!values.first_name.trim()) nextErrors.first_name = "First name is required.";
    if (!values.last_name.trim()) nextErrors.last_name = "Last name is required.";
    if (!values.email.trim()) nextErrors.email = "Email is required.";
    if (!values.phone.trim()) nextErrors.phone = "Phone is required.";
    if (!values.date_of_birth) {
      nextErrors.date_of_birth = "Date of birth is required.";
    } else if (calculateAge(values.date_of_birth) < 18) {
      nextErrors.date_of_birth = "Signer must be at least 18 years old.";
    }
    if (!values.address_line1.trim()) nextErrors.address_line1 = "Address line 1 is required.";
    if (!values.city.trim()) nextErrors.city = "City is required.";
    if (!values.state) nextErrors.state = "State is required.";
    if (!values.zip.trim()) nextErrors.zip = "ZIP is required.";
    if (!values.esign_consent) nextErrors.esign_consent = "Electronic signature consent is required.";
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      nextErrors.signature_data = "Signature is required.";
    }

    return nextErrors;
  }

  function validateGuardian(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!guardianValues.first_name.trim()) nextErrors["guardian.first_name"] = "First name is required.";
    if (!guardianValues.last_name.trim()) nextErrors["guardian.last_name"] = "Last name is required.";
    if (!guardianValues.email.trim()) nextErrors["guardian.email"] = "Email is required.";
    if (!guardianValues.phone.trim()) nextErrors["guardian.phone"] = "Phone is required.";
    if (!guardianValues.address_line1.trim()) nextErrors["guardian.address_line1"] = "Address line 1 is required.";
    if (!guardianValues.city.trim()) nextErrors["guardian.city"] = "City is required.";
    if (!guardianValues.state) nextErrors["guardian.state"] = "State is required.";
    if (!guardianValues.zip.trim()) nextErrors["guardian.zip"] = "ZIP is required.";
    if (!guardianValues.esign_consent) {
      nextErrors["guardian.esign_consent"] = "Electronic signature consent is required.";
    }

    minorValues.slice(0, minorCount).forEach((minor, index) => {
      if (!minor.first_name.trim()) nextErrors[`minor.${index}.first_name`] = "First name is required.";
      if (!minor.last_name.trim()) nextErrors[`minor.${index}.last_name`] = "Last name is required.";
      if (!minor.date_of_birth) {
        nextErrors[`minor.${index}.date_of_birth`] = "Date of birth is required.";
      } else if (calculateAge(minor.date_of_birth) >= 18) {
        nextErrors[`minor.${index}.date_of_birth`] = "Minor must be under 18 years old.";
      }
      if (!minor.address_line1.trim()) nextErrors[`minor.${index}.address_line1`] = "Address line 1 is required.";
      if (!minor.city.trim()) nextErrors[`minor.${index}.city`] = "City is required.";
      if (!minor.state) nextErrors[`minor.${index}.state`] = "State is required.";
      if (!minor.zip.trim()) nextErrors[`minor.${index}.zip`] = "ZIP is required.";
    });

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      nextErrors.signature_data = "Signature is required.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = signerMode === "adult" ? validate() : validateGuardian();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const signatureData = signatureRef.current?.toDataURL();
    if (!signatureData) {
      setErrors((current) => ({ ...current, signature_data: "Signature is required." }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waiver/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          signerMode === "adult"
            ? {
                token,
                signer_type: "adult",
                ...values,
                signature_data: signatureData
              }
            : {
                token,
                signer_type: "guardian",
                ...guardianValues,
                signature_data: signatureData,
                minors: minorValues.slice(0, minorCount)
              }
        )
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSubmitError(data.error || "Unable to submit waiver. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSubmittedCount((current) => current + 1);
      setIsSubmitted(true);
      clearSignature();
    } catch (error) {
      console.error(error);
      setSubmitError("Unable to submit waiver. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <section className="rounded-3xl border border-amber-400/20 bg-neutral-900/95 p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">ATX Boats and Buses</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Reservation Waiver</h1>
          <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-neutral-950/60 p-4 text-sm text-neutral-300 sm:grid-cols-2">
            <p><span className="text-neutral-500">Trip Date:</span> {waiver.booking.date}</p>
            <p><span className="text-neutral-500">Time:</span> {waiver.booking.startTime} - {waiver.booking.endTime}</p>
            <p><span className="text-neutral-500">Primary Guest:</span> {waiver.booking.customerName}</p>
            <p><span className="text-neutral-500">Vehicle Type:</span> {waiver.booking.vehicleType}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-neutral-900 p-6">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-white">Waiver Agreement</h2>
            <div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300">
              {progressLabel}
            </div>
          </div>
          <div
            className="prose prose-invert mt-6 max-w-none text-neutral-300 prose-headings:text-white prose-strong:text-white prose-a:text-amber-300"
            dangerouslySetInnerHTML={{ __html: waiver.body }}
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-neutral-900 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSignerModeChange("adult")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                signerMode === "adult"
                  ? "border-amber-400 bg-amber-400 text-black"
                  : "border-white/10 bg-neutral-950 text-neutral-300 hover:border-amber-400/40 hover:text-white"
              }`}
            >
              I am signing for myself (Adult)
            </button>
            <button
              type="button"
              onClick={() => handleSignerModeChange("guardian")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                signerMode === "guardian"
                  ? "border-amber-400 bg-amber-400 text-black"
                  : "border-white/10 bg-neutral-950 text-neutral-300 hover:border-amber-400/40 hover:text-white"
              }`}
            >
              I am a Parent/Guardian signing for minor(s)
            </button>
          </div>

          {isSubmitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <h3 className="text-xl font-semibold text-white">Waiver signed successfully!</h3>
              <p className="mt-2 text-sm text-emerald-200">
                A PDF copy has been sent to your email.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Another guest needs to sign?
              </button>
            </div>
          ) : signerMode === "guardian" ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-neutral-950/40 p-5">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">How many minors are you signing for?</span>
                  <select
                    value={minorCount}
                    onChange={(event) => handleMinorCountChange(Number(event.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400 sm:w-56"
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-4">
                {minorValues.slice(0, minorCount).map((minor, index) => {
                  const isExpanded = expandedMinors.includes(index);

                  return (
                    <div key={index} className="rounded-2xl border border-white/10 bg-neutral-950/40">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMinors((current) =>
                            current.includes(index) ? current.filter((value) => value !== index) : [...current, index]
                          )
                        }
                        className="flex w-full items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="text-base font-semibold text-white">Minor #{index + 1}</span>
                        <span className="text-sm text-amber-300">{isExpanded ? "Collapse" : "Expand"}</span>
                      </button>

                      {isExpanded && (
                        <div className="space-y-5 border-t border-white/10 px-5 py-5">
                          <div className="grid gap-4 md:grid-cols-3">
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-neutral-200">First Name</span>
                              <input
                                type="text"
                                value={minor.first_name}
                                onChange={(event) => updateMinorValue(index, "first_name", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              />
                              {errors[`minor.${index}.first_name`] && <p className="text-sm text-red-400">{errors[`minor.${index}.first_name`]}</p>}
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-neutral-200">Last Name</span>
                              <input
                                type="text"
                                value={minor.last_name}
                                onChange={(event) => updateMinorValue(index, "last_name", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              />
                              {errors[`minor.${index}.last_name`] && <p className="text-sm text-red-400">{errors[`minor.${index}.last_name`]}</p>}
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-neutral-200">Middle Name</span>
                              <input
                                type="text"
                                value={minor.middle_name}
                                onChange={(event) => updateMinorValue(index, "middle_name", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              />
                            </label>
                          </div>

                          <label className="space-y-2 md:max-w-xs">
                            <span className="text-sm font-medium text-neutral-200">Date of Birth</span>
                            <input
                              type="date"
                              value={minor.date_of_birth}
                              onChange={(event) => updateMinorValue(index, "date_of_birth", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                            />
                            {errors[`minor.${index}.date_of_birth`] && <p className="text-sm text-red-400">{errors[`minor.${index}.date_of_birth`]}</p>}
                          </label>

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2 md:col-span-2">
                              <span className="text-sm font-medium text-neutral-200">Address Line 1</span>
                              <input
                                type="text"
                                value={minor.address_line1}
                                onChange={(event) => updateMinorValue(index, "address_line1", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              />
                              {errors[`minor.${index}.address_line1`] && <p className="text-sm text-red-400">{errors[`minor.${index}.address_line1`]}</p>}
                            </label>
                            <label className="space-y-2 md:col-span-2">
                              <span className="text-sm font-medium text-neutral-200">Address Line 2</span>
                              <input
                                type="text"
                                value={minor.address_line2}
                                onChange={(event) => updateMinorValue(index, "address_line2", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-neutral-200">City</span>
                              <input
                                type="text"
                                value={minor.city}
                                onChange={(event) => updateMinorValue(index, "city", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              />
                              {errors[`minor.${index}.city`] && <p className="text-sm text-red-400">{errors[`minor.${index}.city`]}</p>}
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-neutral-200">State</span>
                              <select
                                value={minor.state}
                                onChange={(event) => updateMinorValue(index, "state", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              >
                                <option value="">Select state</option>
                                {US_STATES.map((state) => (
                                  <option key={state} value={state}>
                                    {state}
                                  </option>
                                ))}
                              </select>
                              {errors[`minor.${index}.state`] && <p className="text-sm text-red-400">{errors[`minor.${index}.state`]}</p>}
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-neutral-200">ZIP</span>
                              <input
                                type="text"
                                value={minor.zip}
                                onChange={(event) => updateMinorValue(index, "zip", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                              />
                              {errors[`minor.${index}.zip`] && <p className="text-sm text-red-400">{errors[`minor.${index}.zip`]}</p>}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/10 bg-neutral-950/40 p-5">
                <h3 className="text-xl font-semibold text-white">Parent/Guardian Information</h3>
                <div className="mt-5 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">First Name</span>
                      <input
                        type="text"
                        value={guardianValues.first_name}
                        onChange={(event) => updateGuardianValue("first_name", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                      {errors["guardian.first_name"] && <p className="text-sm text-red-400">{errors["guardian.first_name"]}</p>}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">Last Name</span>
                      <input
                        type="text"
                        value={guardianValues.last_name}
                        onChange={(event) => updateGuardianValue("last_name", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                      {errors["guardian.last_name"] && <p className="text-sm text-red-400">{errors["guardian.last_name"]}</p>}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">Middle Name</span>
                      <input
                        type="text"
                        value={guardianValues.middle_name}
                        onChange={(event) => updateGuardianValue("middle_name", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">Email</span>
                      <input
                        type="email"
                        value={guardianValues.email}
                        onChange={(event) => updateGuardianValue("email", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                      {errors["guardian.email"] && <p className="text-sm text-red-400">{errors["guardian.email"]}</p>}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">Phone</span>
                      <input
                        type="tel"
                        value={guardianValues.phone}
                        onChange={(event) => updateGuardianValue("phone", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                      {errors["guardian.phone"] && <p className="text-sm text-red-400">{errors["guardian.phone"]}</p>}
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-neutral-200">Address Line 1</span>
                      <input
                        type="text"
                        value={guardianValues.address_line1}
                        onChange={(event) => updateGuardianValue("address_line1", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                      {errors["guardian.address_line1"] && <p className="text-sm text-red-400">{errors["guardian.address_line1"]}</p>}
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-neutral-200">Address Line 2</span>
                      <input
                        type="text"
                        value={guardianValues.address_line2}
                        onChange={(event) => updateGuardianValue("address_line2", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">City</span>
                      <input
                        type="text"
                        value={guardianValues.city}
                        onChange={(event) => updateGuardianValue("city", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                      {errors["guardian.city"] && <p className="text-sm text-red-400">{errors["guardian.city"]}</p>}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">State</span>
                      <select
                        value={guardianValues.state}
                        onChange={(event) => updateGuardianValue("state", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      {errors["guardian.state"] && <p className="text-sm text-red-400">{errors["guardian.state"]}</p>}
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-neutral-200">ZIP</span>
                      <input
                        type="text"
                        value={guardianValues.zip}
                        onChange={(event) => updateGuardianValue("zip", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                      />
                      {errors["guardian.zip"] && <p className="text-sm text-red-400">{errors["guardian.zip"]}</p>}
                    </label>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                    <input
                      type="checkbox"
                      checked={guardianValues.esign_consent}
                      onChange={(event) => updateGuardianValue("esign_consent", event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-900 text-amber-400 focus:ring-amber-400"
                    />
                    <span className="text-sm text-neutral-300">
                      By checking this box, I agree that my electronic signature is the legal equivalent of my handwritten signature and that I am the legal parent or guardian of the minor(s) listed above.
                    </span>
                  </label>
                  {errors["guardian.esign_consent"] && <p className="text-sm text-red-400">{errors["guardian.esign_consent"]}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-neutral-200">Signature</h3>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:border-amber-400/40 hover:text-white"
                  >
                    Clear Signature
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                  <SignatureCanvas
                    ref={(instance) => {
                      signatureRef.current = instance;
                    }}
                    penColor="#111111"
                    canvasProps={{
                      className: "h-56 w-full min-w-[300px]"
                    }}
                  />
                </div>
                {errors.signature_data && <p className="text-sm text-red-400">{errors.signature_data}</p>}
              </div>

              {submitError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-amber-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Waiver"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">First Name</span>
                  <input
                    type="text"
                    value={values.first_name}
                    onChange={(event) => updateValue("first_name", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.first_name && <p className="text-sm text-red-400">{errors.first_name}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">Last Name</span>
                  <input
                    type="text"
                    value={values.last_name}
                    onChange={(event) => updateValue("last_name", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.last_name && <p className="text-sm text-red-400">{errors.last_name}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">Middle Name</span>
                  <input
                    type="text"
                    value={values.middle_name}
                    onChange={(event) => updateValue("middle_name", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">Email</span>
                  <input
                    type="email"
                    value={values.email}
                    onChange={(event) => updateValue("email", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">Phone</span>
                  <input
                    type="tel"
                    value={values.phone}
                    onChange={(event) => updateValue("phone", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.phone && <p className="text-sm text-red-400">{errors.phone}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">Date of Birth</span>
                  <input
                    type="date"
                    value={values.date_of_birth}
                    onChange={(event) => updateValue("date_of_birth", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.date_of_birth && <p className="text-sm text-red-400">{errors.date_of_birth}</p>}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-neutral-200">Address Line 1</span>
                  <input
                    type="text"
                    value={values.address_line1}
                    onChange={(event) => updateValue("address_line1", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.address_line1 && <p className="text-sm text-red-400">{errors.address_line1}</p>}
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-neutral-200">Address Line 2</span>
                  <input
                    type="text"
                    value={values.address_line2}
                    onChange={(event) => updateValue("address_line2", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">City</span>
                  <input
                    type="text"
                    value={values.city}
                    onChange={(event) => updateValue("city", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.city && <p className="text-sm text-red-400">{errors.city}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">State</span>
                  <select
                    value={values.state}
                    onChange={(event) => updateValue("state", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="text-sm text-red-400">{errors.state}</p>}
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-200">ZIP</span>
                  <input
                    type="text"
                    value={values.zip}
                    onChange={(event) => updateValue("zip", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                  />
                  {errors.zip && <p className="text-sm text-red-400">{errors.zip}</p>}
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-neutral-950/40 p-4">
                <input
                  type="checkbox"
                  checked={values.esign_consent}
                  onChange={(event) => updateValue("esign_consent", event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-900 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-sm text-neutral-300">
                  By checking this box, I agree that my electronic signature is the legal equivalent of my handwritten signature.
                </span>
              </label>
              {errors.esign_consent && <p className="text-sm text-red-400">{errors.esign_consent}</p>}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-neutral-200">Signature</h3>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:border-amber-400/40 hover:text-white"
                  >
                    Clear Signature
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                  <SignatureCanvas
                    ref={(instance) => {
                      signatureRef.current = instance;
                    }}
                    penColor="#111111"
                    canvasProps={{
                      className: "h-56 w-full min-w-[300px]"
                    }}
                  />
                </div>
                {errors.signature_data && <p className="text-sm text-red-400">{errors.signature_data}</p>}
              </div>

              {submitError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-amber-400 px-5 py-4 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Waiver"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
