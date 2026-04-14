# ATX Boats and Buses — Implementation Todo

## Phases 1-6: Complete ✅
*(Scaffolding, DB, Booking UI, Stripe, Email, Admin — all done)*

## Booking UI Overhaul ✅
*(Unified form, CalendarPicker, TimeSlotGrid, bus/boat flows — all done)*

---

## Phase 8: Homepage Redesign — Dark Premium Theme + Category Pages

### Goal
Simplify the homepage to give the user two clear choices: **Rent a Bus** or **Rent a Boat**. Each links to a category page showing the two vehicle options within that category. Selecting a vehicle goes to the existing booking/detail page. The new dark theme from `example_images/ai_studio_design/page.tsx` should be consistent across all pages.

### User Flow
```
Homepage  →  /buses  →  /vehicles/prevost-tour-bus   (existing booking page)
                    →  /vehicles/executive-shuttle    (existing booking page)

Homepage  →  /boats  →  /vehicles/carver-yacht        (existing booking page)
                    →  /vehicles/cruiser-yacht         (existing booking page)
```

### Phase 8a: Setup & Dependencies
- [ ] 1. Install `motion` and `lucide-react` packages
- [ ] 2. Copy images to `public/` — `boat-slider-image-default.webp`, `bus-slider-image-default.webp`, `logo.webp` from `example_images/ai_studio_design/`

### Phase 8b: Global Theme Changes
- [ ] 3. Update `app/layout.tsx` body classes from light (`bg-slate-50 text-slate-900`) to dark (`bg-neutral-950 text-white`)
- [ ] 4. Restyle `components/layout/Navbar.tsx` — dark bg, white text, backdrop blur, updated logo, nav links: Bus Rentals, Boat Rentals, About Us, Contact
- [ ] 5. Restyle `components/layout/Footer.tsx` — dark theme, border-top, 4-column grid (logo+description, social icons, services links, company links)
- [ ] 6. Update `components/ui/Button.tsx` — white bg, black text, rounded-full pill shape to match design
- [ ] 7. Update `components/ui/Container.tsx` — bump max-width to `max-w-7xl`

### Phase 8c: Homepage Redesign
- [ ] 8. Rewrite `app/page.tsx` — replace vehicle card grid with:
  - Hero section: background image, "Explore Austin in Style" heading, two CTA buttons (Rent a Bus → `/buses`, Rent a Boat → `/boats`)
  - Two large service cards (Bus + Boat) with background images, overlay gradients, hover zoom effects
  - Motion animations for fade-in

### Phase 8d: Category Pages (NEW)
- [ ] 9. Create `app/buses/page.tsx` — dark-themed page showing two bus vehicle cards (Prevost Tour Bus, Executive Shuttle). Fetches from `/api/vehicles`, filters `type === "party-bus"`. Each card links to `/vehicles/[slug]`.
- [ ] 10. Create `app/boats/page.tsx` — same pattern for boats. Filters `type === "party-boat"`. Each card links to `/vehicles/[slug]`.

### Phase 8e: Restyle Existing Pages for Dark Theme
- [ ] 11. Update `app/vehicles/[slug]/page.tsx` — dark theme text/bg colors (e.g., `text-slate-700` → `text-neutral-300`, skeletons `bg-slate-200` → `bg-neutral-800`)
- [ ] 12. Update `components/vehicles/VehicleCard.tsx` — dark card bg, white text
- [ ] 13. Update `app/contact/page.tsx` / `components/contact/ContactForm.tsx` — dark theme adjustments

### Phase 8f: Cleanup
- [ ] 14. Remove old `#vehicles` anchor references
- [ ] 15. Verify all pages are consistent with dark theme

---

## Notes
- All existing booking functionality (UnifiedBookingForm, checkout, webhooks, etc.) stays **untouched**
- Homepage becomes a landing/funnel page — no longer shows individual vehicle cards directly
- Category pages (`/buses`, `/boats`) replace the old vehicle grid
- Admin pages (`/admin/*`) are **NOT** restyled — stay as-is
- The `VehicleCard` component gets reused on category pages with dark styling

---

---

## Hotfix: Missing DB Columns Causing Webhook Booking Insert Failure

### Problem
Stripe webhook `checkout.session.completed` handler tries to INSERT into 3 columns that don't exist in the `bookings` table: `deposit_amount`, `remaining_amount`, `stripe_customer_id`. This causes the INSERT to fail, so bookings are never saved despite payment succeeding.

### Tasks
- [x] 1. Create migration SQL script (`scripts/add-booking-columns.sql`) to ALTER TABLE and add the 3 missing columns
- [x] 2. Update `scripts/seed.sql` CREATE TABLE definition to include the new columns
- [ ] 3. User runs the migration SQL against live Supabase database
- [x] 4. Verify the webhook handler INSERT matches the updated schema

### Review
- Created `scripts/add-booking-columns.sql` — adds 3 missing columns to `bookings` table: `deposit_amount` (INTEGER), `remaining_amount` (INTEGER), `stripe_customer_id` (TEXT)
- Updated `scripts/seed.sql` CREATE TABLE to include the new columns for future DB setups
- No code changes needed — the webhook INSERT already referenced these columns correctly; it was the DB that was missing them
- Root cause: columns were added to the webhook code but the corresponding ALTER TABLE was never run on the live database
