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
