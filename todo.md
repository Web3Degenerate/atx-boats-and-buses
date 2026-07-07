# Security Hardening + SEO/AEO Improvements

## Plan

### 1. Cron auth hardening
- [x] Create `lib/cron-auth.ts` with a header-only, timing-safe check that fails closed when `CRON_SECRET` is unset.
- [x] Use it in `app/api/cron/charge-balances/route.ts` (removes the `?secret=` query-param path).
- [x] Use it in `app/api/cron/waiver-reminders/route.ts`.

### 2. Waiver PII redaction
- [x] Remove `customerEmail` / `customerPhone` from the `/api/waiver/[token]` GET response (UI only renders `customerName`).
- [x] Update the `WaiverData` types in `app/waiver/[token]/page.tsx` and `components/waiver/WaiverSigningForm.tsx`.

### 3. Waiver signing abuse guards
- [x] In `app/api/waiver/sign/route.ts`: reject when the booking is not `confirmed`.
- [x] Reject when signed count has already reached `guest_count`.
- [x] Cap `signature_data` length (500k chars) and cap `minors` array size (20).

### 4. Security headers
- [x] Add `headers()` to `next.config.js`: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS, minimal `Permissions-Policy`.

### 5. Env hygiene
- [x] `.env.example`: removed dead `ADMIN_PASSWORD`; added `CRON_SECRET`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `WAIVER_ONLY_ADMIN_EMAILS`, `ADMIN_ALERT_EMAIL`.

### 6. SEO / AEO
- [x] Add `buildFaqJsonLd()` + `FaqItem` type to `lib/seo.ts`.
- [x] `/boats` and `/buses`: Q&A cards now render from a FAQ array (pricing answers built from live vehicle data), with payment/waiver Q&As added and matching `FAQPage` JSON-LD emitted.
- [x] Vehicle pages: per-vehicle FAQ array (use cases, price, capacity, service area, deposit terms, waiver) rendered as cards + `FAQPage` JSON-LD.
- [x] LocalBusiness schema enriched with `priceRange`, `image`, `logo` (via `lib/site-config.ts` + `lib/seo.ts`).
- [x] Homepage hero alt text made descriptive.

### 7. Verify
- [x] `npx tsc --noEmit` — clean, no errors.

## Review

**Security changes**
- `lib/cron-auth.ts` (new): single `isAuthorizedCronRequest()` used by both cron routes. It returns unauthorized when `CRON_SECRET` is unset (previously an unset secret made `Authorization: Bearer undefined` a valid credential), only accepts the header (the old `?secret=` query param leaked the secret into request logs), and compares with `crypto.timingSafeEqual`.
- `/api/waiver/[token]` no longer returns the booking customer's email and phone. The waiver link is shared with every guest, so anyone holding it could scrape the booker's contact info; the signing UI only ever displayed the name.
- `/api/waiver/sign` now refuses to sign when the booking isn't `confirmed` (e.g. cancelled bookings), refuses once signatures reach the link's `guest_count` (previously unlimited — each extra signing generated and stored a PDF and sent an email to an arbitrary address), caps `signature_data` at 500k chars, and caps `minors` at 20 per submission.
- `next.config.js` now sends `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and `Permissions-Policy` on every response.
- `.env.example` now reflects the variables the code actually uses.

**SEO/AEO changes**
- New `buildFaqJsonLd()` emits `FAQPage` schema. On `/boats`, `/buses`, and each vehicle page, the visible Q&A cards and the JSON-LD render from the same array, so they can't drift apart. Pricing answers are composed from live vehicle data (DB-backed), not hardcoded copy. Added deposit/payment and waiver Q&As sourced from actual checkout behavior (20% deposit, auto-charge 2 days out, pay-in-full within 2 days).
- LocalBusiness JSON-LD now includes `priceRange`, `image`, and `logo`.
- Homepage hero image alt text is now descriptive instead of "Hero Background".

## Round 2 (follow-up suggestions, completed)

- [x] **Next.js upgraded 14.2.25 → 14.2.35** (patched release for the Dec 2025 security advisory; `eslint-config-next` matched). `tsc --noEmit` clean and `next build` succeeds.
- [x] **Rate limiting**: new `lib/rate-limit.ts` — zero-dependency, in-memory fixed-window limiter keyed by client IP. Applied to `/api/contact` (5/10min), `/api/checkout` (10/10min), `/api/waiver/sign` (20/10min), `/api/coupons/validate` (15/5min); all return 429. Best-effort per serverless instance — stops bursts and naive scripts; upgrade to Vercel WAF or Upstash later if real abuse shows up.
- [x] **CSP added** to `next.config.js`: `object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self' https://checkout.stripe.com`. Deliberately omits `script-src`/`style-src` so Next inline scripts, AdSense, and Stripe work without a nonce pipeline (a nonce-based `script-src` is the possible future tightening).
- [x] **sameAs research**: web search found only similarly named competitors (ATX Boat Rentals, ATX Party Boats, Retro Boat Rentals) — NOT this business; adding those would attach the wrong entity to the schema, so nothing was added. The site footer's social icons are `href="#"` placeholders.

## Round 3 (corporate/executive repositioning, completed)

Goal: eliminate all "party bus" / "party boat" / bachelor(ette) positioning across user-facing copy and schema, replacing it with corporate offsite and client appreciation event messaging. No functional or database changes — the internal `type: "party-bus" | "party-boat"` discriminator was intentionally left alone since it's a backend/DB enum (tied to `waiver_templates.vehicle_type` in Postgres) that is never rendered to users; renaming it would require a schema migration, a separate and riskier change from a copy rewrite.

- [x] Deleted `app/test1/` (leftover noindexed scaffold page with old "Party Buses" copy).
- [x] `lib/site-config.ts`: rewrote `description` and `services` to lead with corporate offsites, client appreciation events, executive bus/boat charters, and statewide executive motorcoach travel; dropped wedding/bachelor(ette) language entirely.
- [x] `lib/seo.ts`: `buildVehicleServiceJsonLd` now emits `serviceType: "Executive bus rental"` / `"Boat charter"` instead of "Party bus rental" / "Boat rental".
- [x] `app/layout.tsx`: rewrote both the `buildMetadata` title and the `title.default` override (the second one was missed in the first pass and caught by a follow-up grep — it's what actually renders on every page without its own title) plus the `keywords` array, now targeting corporate/executive terms and statewide travel to Dallas, Fort Worth, San Antonio, Houston.
- [x] `app/page.tsx`: homepage H1, hero paragraph, and both bus/boat feature-card headings and copy rewritten around corporate offsites and client appreciation events.
- [x] `app/boats/page.tsx`: title, description, H1, intro, and all 6 FAQs rewritten to corporate/executive boat charter framing.
- [x] `app/buses/page.tsx`: title, description, H1, intro, and FAQs rewritten to executive bus/motorcoach framing; added a new FAQ on statewide travel to Dallas, Fort Worth, San Antonio, Houston, and the Hill Country.
- [x] `app/vehicles/[slug]/page.tsx`: `getBestUseCases()` and the metadata description rewritten per vehicle type, including statewide travel for buses.
- [x] `app/contact/page.tsx`: meta description rewritten.
- [x] `data/vehicles.ts`: all four vehicle descriptions rewritten to corporate/executive framing with statewide travel mentioned for both buses. Moved the LED lighting feature from the Prevost Tour Bus to the Executive Shuttle per correction, renamed "LED Party Lighting" → "LED Accent Lighting", and did not invent a replacement feature for the Prevost (dropped from 5 to 4 listed features rather than fabricate an unconfirmed amenity).
- [x] Verified with a full-text grep for "party"/"bachelor" across `app/`, `lib/`, `data/` — only remaining hits are the internal `type` discriminator comparisons and the admin waiver-templates tab keys, neither of which is user-visible.
- [x] `tsc --noEmit` clean and `next build` succeeds (cleared a stale `.next` cache that referenced the deleted `test1` route).

## Round 4 (LocalBusiness schema + footer social links, completed)

- [x] Verified `@alcazarvela` (Instagram) and `alcazarvela` (LinkedIn company page) both resolve to real profiles. The LinkedIn page confirmed ALCAZARVELA is the legal entity operating as "ATX Boats & Buses," explicitly markets away from "party bus" aesthetics toward corporate charters, and lists a headquarters address — owner opted to keep the address out of the schema regardless (see decision below).
- [x] `lib/site-config.ts`: added `openingHours: ["Mo-Su 10:00-17:00"]` and `sameAs: ["https://www.instagram.com/alcazarvela/", "https://www.linkedin.com/company/alcazarvela"]`. `address`/`geo` intentionally left unset per owner decision. `buildLocalBusinessJsonLd()` in `lib/seo.ts` already supported both fields conditionally, so no code changes were needed there.
- [x] `components/layout/Footer.tsx`: replaced the three dead `href="#"` social icons (Instagram, Facebook, Twitter) with two real links — Instagram (`@alcazarvela`) and LinkedIn (chosen as the canonical account over `@boatsandbuses`). Facebook and Twitter/X were removed since no account was confirmed for either, consistent with the owner's decision to drop the unconfirmed Twitter/X placeholder. Also added a visible "Hours: 10am–5pm daily, or during scheduled charters" line, since "or during charters" isn't representable in the strict `openingHours` schema.org format.
- [x] Verified visually: started a local dev server (created a git-ignored `.env.local` with placeholder/dummy values — **not real credentials, and not committed** — plus `.claude/launch.json` for the preview tool) and confirmed in-browser that the homepage title reads "Austin Corporate Boat Charters & Executive Bus Rentals" and the footer renders exactly two social icons linking to the confirmed Instagram and LinkedIn URLs.
- [x] `tsc --noEmit` and `next build` both clean after these changes.

## Open Questions (need owner input)
- Confirm `CRON_SECRET` is set in the Vercel project env. The cron routes now fail closed without it, and the old `?secret=` manual-trigger URL no longer works (use an `Authorization: Bearer $CRON_SECRET` header instead).
- Consider whether "Wedding transportation" should exist anywhere as a secondary category — it was dropped entirely per "focus only on corporate offsites and client appreciation events."
- `.env.local` created in this session has placeholder/dummy values only (fake Stripe keys, fake DB URL, etc.) — needed only to boot the dev server for a visual check. Replace with real values before using `npm run dev` for actual local development. It's already git-ignored, so this doesn't affect version control.
