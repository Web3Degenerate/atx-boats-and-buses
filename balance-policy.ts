// Balance payment policy.
// The remaining balance is charged automatically BALANCE_DUE_DAYS before the trip.
// Bookings within that window pay the full amount at booking.
export const BALANCE_DUE_DAYS = 5;

// Bookings created before BALANCE_POLICY_CUTOFF were promised a 2 day schedule,
// so the balance cron keeps charging those at 2 days.
export const LEGACY_BALANCE_DUE_DAYS = 2;
export const BALANCE_POLICY_CUTOFF = "2026-10-13T18:00:00-05:00";

// Date of the Terms and Conditions customers accept at checkout (recorded in Stripe metadata).
export const TERMS_VERSION = "2026-10-13";
