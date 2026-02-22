# ATX Boats and Buses — Implementation Todo

## Phase 1: Scaffolding + Static Pages ✅
- [x] 1.1 Create Next.js app with TypeScript + Tailwind + App Router
- [x] 1.2 Configure Tailwind theme (colors, fonts)
- [x] 1.3 Copy/organize images into `/public/images/`
- [x] 1.4 Create `types/index.ts` and `data/vehicles.ts`
- [x] 1.5 Build UI primitives: Button, Container
- [x] 1.6 Build Navbar and Footer
- [x] 1.7 Build Homepage: Hero + VehicleCard grid
- [x] 1.8 Build Vehicle Detail page: ImageGallery + VehicleDetails (static, no booking yet)

## Phase 2: Database + Availability API ✅
- [x] 2.1 Create `scripts/seed.sql` with all tables (vehicles, bookings, blocked_dates, site_settings)
- [x] 2.2 Build `lib/db.ts` connection helper
- [x] 2.3 Build `lib/availability.ts` logic (resolves short IDs to DB UUIDs via slug)
- [x] 2.4 Build `GET /api/availability` route

## Phase 3: Booking UI ✅
- [x] 3.1 Install react-day-picker + date-fns
- [x] 3.2 Build DatePicker component
- [x] 3.3 Build TimeRangeSelector component
- [x] 3.4 Build BookingForm component
- [x] 3.5 Integrate BookingForm into vehicle detail page

## Phase 4: Stripe Payment Flow ✅
- [x] 4.1 Build `lib/stripe.ts` client
- [x] 4.2 Build `POST /api/checkout` with manual capture (authorization hold)
- [x] 4.3 Build `POST /api/webhooks/stripe` handler (creates pending_approval bookings)
- [x] 4.4 Build `/booking/success` page
- [x] 4.5 Build `/booking/cancel` page
- [x] 4.6 Add idempotency (unique stripe_session_id) + checkout.session.expired handling

## Phase 5: Email Confirmation ✅
- [x] 5.1 Build `lib/resend.ts` client (lazy getter pattern)
- [x] 5.2 Build BookingConfirmation email template
- [x] 5.3 Integrate emails into webhook: customer "request received" + manager notification
- [x] 5.4 Approval email: sent when manager approves booking
- [x] 5.5 Rejection email: sent when manager rejects booking

## Phase 6: Admin Portal ✅
- [x] 6.1 Build admin layout with password auth (in-memory tokens, AdminGuard)
- [x] 6.2 Build admin bookings dashboard with approve/reject buttons
- [x] 6.3 Build pricing manager (price/hr, min/max hours, fuel charge % per vehicle)
- [x] 6.4 Build blocked dates manager
- [x] 6.5 Build `POST /api/admin/bookings/approve` (captures Stripe payment)
- [x] 6.6 Build `POST /api/admin/bookings/reject` (cancels Stripe auth)

## Booking UI Overhaul ✅
- [x] Unified booking form (UnifiedBookingForm.tsx) for buses and boats
- [x] CalendarPicker component (react-day-picker popover with close-on-click fix)
- [x] TimeSlotGrid component (dynamic columns from slots prop)
- [x] Bus flow: two-date selector, 9AM-11PM pickup, 12AM-2AM + 9AM-11PM return, 48hr max
- [x] Boat flow: single date, 9AM-4PM pickup, same-day return, 4hr max
- [x] Per-vehicle fuel charge toggle in admin
- [x] Dynamic vehicle data from DB (`/api/vehicles` with force-dynamic)
- [x] Contact page with form + click-to-call

## Phase 7: Polish (TODO)
- [ ] 7.1 SEO metadata, globals cleanup
- [ ] 7.2 Loading states and error handling
- [ ] 7.3 Mobile responsiveness pass
- [ ] 7.4 Change "Vehicles" nav link to "About Us" + create About Us page
- [ ] 7.5 Update homepage CTA button ("Browse Vehicles" → TBD)
- [ ] 7.6 Frontend design skill for UI restyling

---

## Review
Phases 1-6 complete. Booking UI overhauled with unified form, calendar pickers, and dynamic time slot grids. Approval workflow with Stripe manual capture implemented. Admin portal fully functional with approve/reject, pricing, and blocked dates management. Contact page added. All code compiles clean (`npm run build` passes). Database hosted on Supabase cloud.
