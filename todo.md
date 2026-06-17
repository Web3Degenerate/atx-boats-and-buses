# Cross-Midnight Booking Fix

## Plan

- [x] Create `scripts/add-booking-end-date.sql` to add, backfill, require, and constrain `bookings.end_date`.
- [x] Update `scripts/seed.sql` so new installs create `bookings.end_date` and enforce the same sanity constraint.
- [x] Update `app/api/webhooks/stripe/route.ts` only where the booking insert is built, adding `end_date` from existing `metadata.endDate`.
- [x] Refactor `lib/availability.ts` so blocked ranges and booking ranges share the same per-day clamping helper.
- [x] Update `lib/availability.ts` booking lookup to include `date::text AS start_date`, `end_date::text`, `start_time::text`, and `end_time::text`, and match bookings where `date <= requested date <= end_date`.
- [x] Apply the 120-minute turnover buffer only on the booking's actual `end_date` day.
- [x] Update `app/api/availability/month/route.ts` so month-level disabled-date checks use the same multi-day booking range behavior.
- [x] Verify `app/api/checkout/route.ts` already sends `endDate` through Stripe metadata and does not contain its own booking-conflict logic.
- [x] Verify the booking UI sends `endDate` with checkout requests; add only a targeted fix if it does not.
- [x] Update the existing one-off recovery script booking insert so it remains compatible with required `bookings.end_date`.
- [x] Run `npx tsc --noEmit`.

## Notes Before Coding

- `app/api/checkout/route.ts` already includes `endDate` in the request body type, uses `actualEndDate = endDate || date` for duration, and sends `endDate: endDate || date` in Stripe metadata.
- `components/booking/UnifiedBookingForm.tsx` already posts `endDate: returnDate` to checkout.
- I did not find a separate pre-checkout booking conflict check in `app/api/checkout/route.ts`; availability checks flow through the booking UI/API path instead.
- `app/api/admin/bookings/route.ts` should keep using `b.date >= CURRENT_DATE` as requested.

## Review

- Added `scripts/add-booking-end-date.sql` to add `bookings.end_date`, backfill existing rows to `date`, enforce `NOT NULL`, and add `bookings_end_after_start_check`.
- Updated `scripts/seed.sql` so new installs include `end_date` and the same check constraint.
- Updated the Stripe webhook booking insert to persist `end_date` from existing checkout metadata.
- Updated `lib/availability.ts` so bookings are queried as date ranges and clamped onto the requested availability date, matching the blocked date pattern.
- Updated `app/api/availability/month/route.ts` so month-level disabled-date checks use the same multi-day booking range behavior.
- Preserved the 120-minute turnover buffer and applied it only on the booking's actual `end_date` day.
- Updated the existing one-off recovery script insert to include `end_date` so it remains compatible after the migration.
- Verified `app/api/checkout/route.ts` already sends `endDate` to Stripe metadata and does not contain a separate booking conflict check.
- Verified `components/booking/UnifiedBookingForm.tsx` already posts `endDate: returnDate`.
- TypeScript verification passed: `npx tsc --noEmit`.

Manual verification still to run after applying the migration:

- Run `scripts/add-booking-end-date.sql` locally; existing rows should backfill with `end_date = date`, and the constraint should pass.
- Insert an overnight test booking with `date = '2026-05-09'`, `end_date = '2026-05-10'`, `start_time = '21:00'`, and `end_time = '00:30'`.
- Check Prevost availability on `2026-05-09`; slots from `21:00` onward should be unavailable.
- Check Prevost availability on `2026-05-10`; the `00:30 + 120 minute` buffer ends at `02:30`, before the visible `09:00` slot grid, so normal daytime slots should remain available unless business rules expect the buffer to affect the first visible slot anyway.
- Check Prevost availability on `2026-05-08`; it should be unaffected.
- Check a same-day booking such as `2026-05-15`, `10:00-14:00`; behavior should match the existing same-day overlap plus turnover behavior.

---

## Repo Sync: Update Local Clone from GitHub

### Goal
Bring the local `main` branch up to date with `origin/main` so development can continue safely on this machine.

### Current Findings
- Local branch: `main`
- Remote: `origin` → `https://github.com/Web3Degenerate/atx-boats-and-buses.git`
- Status after fetch: local `main` is behind `origin/main` by 2 commits
- Local working tree has existing uncommitted changes:
  - Deleted: `.env.example`
  - Untracked: `AGENTS.md`

### Tasks
- [x] 1. Inspect local Git status, branch, and remotes
- [x] 2. Fetch latest refs from GitHub
- [x] 3. Confirm local branch is behind `origin/main` by 2 commits
- [x] 4. Confirm plan with user before changing tracked files
- [x] 5. Temporarily protect local work if needed because upstream also changed `todo.md`
- [x] 6. Pull fast-forward updates from `origin/main`
- [x] 7. Restore/preserve local working-tree changes (`.env.example`, `AGENTS.md`, and this sync note)
- [x] 8. Re-check working tree status after pull
- [x] 9. Add Review section summarizing the sync result

### Review
- Fetched `origin` and fast-forwarded local `main` from `8ebe179` to `cd0bf83`.
- Verified local `main` is current with `origin/main` (`0` ahead, `0` behind).
- Preserved local workspace changes: `.env.example` remains deleted locally, `AGENTS.md` remains untracked, and this `todo.md` sync note remains local.
- Resolved the `todo.md` conflict by keeping the upstream Cross-Midnight Booking Fix notes and appending this sync/startup record.

## Local Dev Startup

### Goal
Install local dependencies if needed and run the Next.js dev server to confirm the local version starts.

### Tasks
- [x] 1. Inspect package manager and scripts
- [x] 2. Check whether `node_modules` is present
- [x] 3. Run `npm install` because `node_modules` is missing
- [x] 4. Run `npm run dev`
- [x] 5. Confirm the server URL and note any startup errors

### Review
- Installed dependencies with `npm install`; npm completed successfully and created `node_modules`.
- npm reported deprecated package warnings and 12 audit findings; no install failure occurred.
- Started the Next.js dev server with `npm run dev`.
- Confirmed the app responds at `http://localhost:3000` with `HTTP/1.1 200 OK`.

---

## Sales Tax Line Item

### Goal
Add a built-in 8.25% sales tax for all vehicle rentals, show it as its own line item in the vehicle booking Price Summary, and include it in the amount charged through checkout.

### Findings
- Active vehicle pages render `components/booking/UnifiedBookingForm.tsx`.
- The visible Price Summary currently calculates `basePrice + fuelCharge`, then applies coupons to that total.
- `app/api/checkout/route.ts` is the authoritative server-side Stripe amount calculation and currently matches the same `base + fuel` pattern.
- Stripe webhook stores `session.amount_total` as `bookings.total_price`, while deposit and remaining amounts come from checkout metadata.
- Older unused booking form components (`BookingForm.tsx`, `BusBookingForm.tsx`) still have independent Price Summary calculations.

### Tasks
- [x] 1. Add a shared sales tax rate constant/helper so client and checkout use the same 8.25% rate
- [x] 2. Update `UnifiedBookingForm.tsx` Price Summary to show `Sales Tax (8.25%)` and add it to the displayed total
- [x] 3. Keep coupon behavior clear by applying coupons before tax, then calculating tax on the discounted taxable rental subtotal
- [x] 4. Update `app/api/checkout/route.ts` to calculate the same tax-inclusive total for Stripe deposit/remaining amounts
- [x] 5. Update older booking forms or confirm they are unused and leave them alone
- [x] 6. Run TypeScript verification
- [x] 7. Add Review section summarizing what changed and why

### Review
- Added `lib/pricing.ts` with the shared 8.25% sales tax rate and cent-based rounding helpers.
- Updated the active `UnifiedBookingForm` Price Summary to show `Sales Tax (8.25%)` and include it in the displayed total and 20% deposit.
- Coupons now reduce the rental subtotal first, then sales tax is calculated on the discounted taxable subtotal.
- Updated `app/api/checkout/route.ts` so Stripe deposit and remaining-balance amounts include the same sales tax calculation.
- Updated legacy `BookingForm` and `BusBookingForm` summaries so any future reuse shows tax-inclusive totals.
- Verified with `npx tsc --noEmit`.

---

## Publish Sales Tax Changes

### Goal
Push the completed sales tax implementation to GitHub without including unrelated local files.

### Tasks
- [x] 1. Inspect git status, diff, and remote
- [x] 2. Identify intended scope: sales-tax implementation files plus `todo.md`
- [x] 3. Verify GitHub CLI availability/authentication
- [x] 4. Create a `codex/` branch from `main`
- [x] 5. Stage only scoped files
- [x] 6. Run TypeScript verification
- [x] 7. Commit the scoped changes
- [x] 8. Push the branch to `origin`
- [x] 9. Open a draft pull request if available; `gh` is not installed locally
- [x] 10. Add Review section summarizing publish result

### Review
- Created branch `codex/add-sales-tax-line-item`.
- Staged only the sales-tax implementation and `todo.md`.
- Left unrelated local files out of the commit: `.env.example` deletion, `.DS_Store`, and `AGENTS.md`.
- Verified with `npx tsc --noEmit`.
- Pushed branch `codex/add-sales-tax-line-item` to `origin`.
- Opened draft PR #1: https://github.com/Web3Degenerate/atx-boats-and-buses/pull/1
