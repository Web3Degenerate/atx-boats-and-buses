# FAQ System (v1: DB-backed FAQ pages + admin editor; v2: keyword-driven content queue)

Goal: every FAQ is a Google-indexable landing page targeting a real search phrase. Admin creates FAQs in the panel (TinyMCE, same pattern as email/waiver templates); each question gets its own URL (`/faq/<slug>`) that renders the target answer on top with all other FAQ cards below, plus a master `/faq` page linked from the footer.

Key facts verified in the codebase:
- FAQ cards are hardcoded arrays in `app/boats/page.tsx` / `app/buses/page.tsx`, already emitting `FAQPage` JSON-LD via `buildFaqJsonLd()` in `lib/seo.ts`.
- Footer FAQ link (`components/layout/Footer.tsx`) is a dead `#` (Terms of Service too — out of scope).
- Admin editor pattern to copy: `app/admin/email-templates/page.tsx` (TinyMCE via `@tinymce/tinymce-react`, `isAdminAuthorized()` API routes, raw `pg` queries).
- Migrations are plain SQL files in `scripts/` (e.g. `waiver-migration.sql`), run manually against the DB.
- `app/sitemap.ts` is static today (imports `data/vehicles`, not DB) — will become async to include FAQ slugs.

## V1 Plan

### Database
- [x] `scripts/faq-migration.sql`: `faqs` table — `id UUID`, `slug TEXT UNIQUE`, `question TEXT`, `answer_html TEXT`, `category TEXT` (`boats` | `buses` | `general`), `sort_order INT`, `published BOOLEAN DEFAULT true`, timestamps. Seeded with the 8 unique existing FAQs (deposit + waiver questions deduped into `general`; computed pricing/capacity ones stay in code). **Migration already run against the DB** (idempotent: `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`).

### Lib
- [x] `lib/faqs.ts`: `getPublishedFaqs(categories?)`, `getPublishedFaqBySlug(slug)`, `slugifyQuestion()`, and `stripHtml()` for JSON-LD (schema.org `Answer.text` gets plain text; the page renders the rich HTML).

### Admin (copy email-templates pattern)
- [x] `/api/admin/faqs` (GET list incl. unpublished, POST create) and `/api/admin/faqs/[id]` (PUT, DELETE), all behind `isAdminAuthorized()`; slug collisions return 409 with a clear message.
- [x] `/admin/faqs` page: list rows with View/Edit/Delete; create/edit form — question (with hint to phrase it like a Google search), TinyMCE answer, category, sort order, publish toggle, slug auto-generated from the question until manually edited.
- [x] "FAQs" nav link in `components/admin/AdminShell.tsx`.

### Public pages
- [x] `/faq` page (`app/faq/page.tsx`): published FAQs as cards grouped by category, `buildMetadata` + breadcrumb + `FAQPage` JSON-LD, `force-dynamic`, contact-us escape hatch.
- [x] `/faq/[slug]` page: question as title tag + H1 + expanded answer on top, boats/buses CTAs, all other FAQ cards below linking to their own slugs, canonical to itself, `notFound()` for unknown/unpublished slugs.
- [x] Footer FAQ link → `/faq`.
- [x] `/boats` and `/buses`: DB FAQs (category + general) as linked cards via new shared `components/faq/FaqCard.tsx`; computed live-pricing FAQ (and bus capacity FAQ) kept in code; "See all frequently asked questions →" link added.
- [x] `app/sitemap.ts`: async — adds `/faq` + every published `/faq/<slug>` (lastModified from `updated_at`), vehicle routes now from DB, static-file fallback if the DB is unreachable.

### Verify
- [x] `tsc --noEmit` clean, `next build` clean. In-browser (dev server against live DB): `/faq` groups all 8 FAQs by category with correct title/canonical; `/faq/how-do-deposits-and-payment-work` renders question as title+H1, answer-derived meta description, FAQPage schema with the featured question first (8 entries), 7 other cards below; `/boats` FAQPage schema leads with live DB pricing ($275 Cobalt) + 5 linked DB FAQs; `/buses` shows computed pricing/capacity + 5 DB FAQs; unknown slug → 404; sitemap lists all 8 FAQ URLs; zero console errors.

## V2 Plan (keyword discovery → approval queue → AI drafts) — not started, design sketch

1. **Keyword harvesting**: scheduled job expands seed phrases ("lake austin boat rental", "austin party bus", …) through Google Autocomplete (the unofficial `suggestqueries.google.com` endpoint — free, same data you see typing manually; fallback: manual paste box in admin). Dedupe against existing FAQ questions/slugs.
2. **`content_suggestions` table**: `term`, `source`, `type` (`faq` | `article`), `status` (`suggested` → `approved` → `drafted` → `published` | `rejected`), `draft_html`.
3. **`/admin/content-queue`**: review harvested terms; Approve triggers a draft-generation API route calling the Claude API (drafting is user-facing copy → sonnet-5 or opus-4.8 per model policy; harvesting/clustering is mechanical). Draft lands back in the queue for TinyMCE edit → Publish creates a `faqs` row (or a blog post).
4. **Blog articles** need a `/blog` route + articles table — scope as v2.5 once the FAQ queue proves out.
5. Cost/abuse guard: generation only on explicit admin click, never auto-publish.

## Review (v1 — shipped in working tree, not yet committed)

**What changed:** FAQs moved from hardcoded arrays into a `faqs` DB table managed at `/admin/faqs` (TinyMCE, same pattern as email templates). Every FAQ now has its own indexable landing page at `/faq/<slug>` — the question is the title tag and H1 with the answer on top, and all other FAQ cards render below, so a searcher clicking through from a long-tail query ("lake austin boat rental with captain" → a future captain-policy FAQ) lands directly on their answer. `/faq` is the master page (footer link fixed from `#`), `/boats` and `/buses` keep their FAQ sections but pull from the DB, and the sitemap now lists every FAQ URL plus DB-sourced vehicle slugs.

**Why the split between DB and computed FAQs:** the pricing FAQ (both pages) and bus-capacity FAQ interpolate live vehicle prices/capacities from the DB; storing them as admin-typed text would silently go stale on the next price change, so they stay in code and merge into the cards + JSON-LD alongside the DB rows.

**Notes:**
- `faqs` migration is already applied to the DB (additive + idempotent), so deploy is just the code push. The 8 seeded FAQs match what was previously hardcoded — zero visible regression until new FAQs are added.
- FAQ JSON-LD strips HTML for `Answer.text`; pages render the TinyMCE HTML directly (admin-authored, trusted).
- New FAQs are live immediately at `/faq/<slug>` (pages are `force-dynamic`); Google picks them up via the sitemap.
- V2 (autocomplete keyword harvesting → admin approval queue → Claude-drafted answers) is designed above, not started.

---

# Option B: Admin Approval Flow (+ critical pricing fix)

Approved design: bookings become requests. Checkout places an auth hold (manual capture) instead of charging. Admin approves (capture + confirm + waiver link) or rejects (release hold, $0 fees) — from the dashboard or via a signed one-click review link sent to configurable notification recipients (email and/or SMS gateway addresses).

Key schema facts verified against the live DB (read-only): `status` is enum `booking_status (pending, pending_approval, confirmed, cancelled)`; the overlap exclusion constraint only covers `('pending','confirmed')` — therefore held bookings use **`pending`** (not `pending_approval`), and no migration is needed. Availability queries already treat `pending` as blocking.

## Plan

### Core libs
- [x] `lib/booking-approval.ts` (new): HMAC-signed, expiring (6-day) action token — sign/verify with `NEXTAUTH_SECRET`, fail closed, timing-safe compare. Single-use enforced by booking status (token dies once booking leaves `pending`).
- [x] `lib/booking-actions.ts` (new): shared `approveBooking()` (capture PI → status `confirmed` → create waiver link → confirmation email w/ waiver) and `rejectBooking()` (pending → cancel PI/release hold; confirmed → refund deposit PI **and balance PI if already charged** — fixes the 80%-kept-on-cancellation bug). Also `sendBookingRequestAlerts()` reading recipients from `site_settings.booking_alert_recipients` (fallback `ADMIN_ALERT_EMAIL`). All booking dates cast `::text` (fixes raw JS-Date strings in emails).

### Checkout (also fixes critical bug #1)
- [x] Price/minimums/fuel/capacity now read from the **DB** (`getVehicleBySlug`) instead of stale `data/vehicles.ts` — the live DB already diverged (Cobalt overcharged $75/hr, Carver undercharged, fuel % wrong).
- [x] Add server-side validation: date/time format, `guestCount <= capacity`, duration `<= maximumHours`.
- [x] Truncate `notes` for Stripe's 500-char metadata limit.
- [x] `payment_intent_data.capture_method: "manual"` — checkout now places a hold, not a charge.

### Webhook
- [x] Insert bookings with status `pending`; send customer "request received" email; send admin alert(s) with review link. No waiver link/confirmation until approval.
- [x] On overlap constraint violation (23P01): **auto-cancel the PI** (hold released, customer never charged) + notify customer and admin — previously required a manual refund.

### Admin actions
- [x] `approve`/`reject` routes become thin wrappers over `lib/booking-actions` (status gate: `pending`).
- [x] `/api/booking-action` + `/booking-action` page: token-authenticated, login-free review page (booking summary + Approve/Decline forms with confirm step — safe against email-scanner prefetch since GET never mutates).
- [x] Bookings tab: show status badge + deposit/hold amount; pending requests pinned on top with Approve/Decline buttons.

### Notification recipients setting
- [x] `/api/admin/notification-settings` (admin-only GET/POST) upserting `site_settings.booking_alert_recipients` (comma-separated; supports SMS gateways like `5125551234@vtext.com`).
- [x] `/admin/notifications` page + nav link.
- [x] Whitelist keys in the public `/api/settings` route so recipient emails/phones don't leak (it currently returns every `site_settings` row).

### Safety net
- [x] Daily cron (inside charge-balances run): auto-cancel `pending` bookings older than 6 days (card auth holds expire at ~7) — release PI, mark cancelled, email customer + admin.
- [x] `::text` date casts in cron email queries.

### Copy
- [x] `/booking/success` page: "Booking Request Received" (hold placed, confirmation coming) instead of "Booking Confirmed!".

### Verify
- [x] `tsc --noEmit` + `next build`.

## Review

**New flow:** checkout places a manual-capture authorization hold → webhook records the booking as `pending`, emails the customer a "request received" note, and alerts all configured recipients with a signed one-click review link → admin approves (hold captured, booking confirmed, waiver link created and emailed) or declines (hold released, $0 fees, customer notified) — from `/admin` or the token-authenticated `/booking-action` page. Unactioned requests auto-cancel at 6 days (before the ~7-day hold expiry) via the daily cron.

**Also fixed in this pass (found during the bug hunt):**
- Checkout now charges DB (admin-panel) pricing — it was charging from the stale static file, which had already diverged (Cobalt customers overcharged $75/hr, Carver undercharged with fuel % missing). Verified against a real production booking: a 4-hr Cobalt deposit of $280 = 20% of the static $350/hr, not the displayed $275/hr.
- `total_price` was being stored as the Stripe session `amount_total`, which for deposit bookings is only the deposit — now stored as deposit + remaining.
- Cancelling a fully-paid booking now refunds the balance payment intent too (previously only the deposit — customers lost the 80% balance).
- Overlap-after-payment (exclusion constraint) now auto-releases the hold and notifies the customer instead of paging the admin for a manual refund; webhook returns 200 so Stripe doesn't retry-spam duplicate emails.
- Server-side validation added at checkout: date/time format, guest count vs capacity, max hours; notes truncated to Stripe's metadata limit.
- Email date formatting fixed (`::text` casts) in booking-action and cron emails.
- Public `/api/settings` now whitelists keys instead of dumping the whole `site_settings` table.

**Verified:** `tsc --noEmit` clean, `next build` clean, and in-browser: invalid review tokens fail closed; a valid token (generated for a real confirmed booking, read-only) renders the summary with action buttons correctly suppressed for non-pending status.

**Deploy notes:**
- The Stripe flow change is atomic with this deploy — no DB migration, no Stripe dashboard changes needed (manual capture is per-PaymentIntent).
- After deploy, set booking alert recipients at `/admin/notifications` (falls back to `ADMIN_ALERT_EMAIL` until then).
- End-to-end test recommended in Stripe test mode locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, complete a checkout with 4242…, confirm the pending booking + alert email + review-link approve path. Note: local `.env.local` currently points at the production DB — swap `DATABASE_URL` to a test DB before running write flows locally.

## Deferred (from the bug-hunt list, next pass)
- Pre-payment availability re-check in checkout (#3) — softened by auto-release on conflict, still worth adding.
- Bus availability outside 9:00–21:00 (#4).
- Cron exact-date window (#5), deposit timezone boundary (#8), client rounding display (#9), misc lows (#11–#15).
