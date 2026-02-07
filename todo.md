# ATX Boats and Buses — Implementation Todo

## Phase 1: Scaffolding + Static Pages
- [ ] 1.1 Create Next.js app with TypeScript + Tailwind + App Router
- [ ] 1.2 Configure Tailwind theme (colors, fonts)
- [ ] 1.3 Copy/organize images into `/public/images/`
- [ ] 1.4 Create `types/index.ts` and `data/vehicles.ts`
- [ ] 1.5 Build UI primitives: Button, Container
- [ ] 1.6 Build Navbar and Footer
- [ ] 1.7 Build Homepage: Hero + VehicleCard grid
- [ ] 1.8 Build Vehicle Detail page: ImageGallery + VehicleDetails (static, no booking yet)

## Phase 2: Database + Availability API
- [ ] 2.1 Create `scripts/seed.sql` with all 3 tables
- [ ] 2.2 Build `lib/db.ts` connection helper
- [ ] 2.3 Build `lib/availability.ts` logic
- [ ] 2.4 Build `GET /api/availability` route

## Phase 3: Booking UI
- [ ] 3.1 Install react-day-picker + date-fns
- [ ] 3.2 Build DatePicker component
- [ ] 3.3 Build TimeRangeSelector component
- [ ] 3.4 Build BookingForm component (wires calendar + time + price + customer info)
- [ ] 3.5 Integrate BookingForm into vehicle detail page

## Phase 4: Stripe Payment Flow
- [ ] 4.1 Build `lib/stripe.ts` client
- [ ] 4.2 Build `POST /api/checkout` with transactional locking
- [ ] 4.3 Build `POST /api/webhooks/stripe` handler
- [ ] 4.4 Build `/booking/success` page
- [ ] 4.5 Build `/booking/cancel` page

## Phase 5: Email Confirmation
- [ ] 5.1 Build `lib/resend.ts` client
- [ ] 5.2 Build BookingConfirmation email template
- [ ] 5.3 Integrate email sending into webhook handler

## Phase 6: Admin Portal
- [ ] 6.1 Build admin layout with password auth
- [ ] 6.2 Build admin bookings dashboard + `GET /api/admin/bookings`
- [ ] 6.3 Build pricing manager + `GET/POST/DELETE /api/admin/pricing`
- [ ] 6.4 Build blocked dates manager + `GET/POST/DELETE /api/admin/blocked`

## Phase 7: Polish
- [ ] 7.1 SEO metadata, globals cleanup
- [ ] 7.2 Loading states and error handling
- [ ] 7.3 Mobile responsiveness pass

---

## Review
_(To be filled after implementation)_
