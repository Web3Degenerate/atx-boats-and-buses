-- Lets admins switch off the 2-days-before balance auto-charge for a booking
-- (e.g. customer will pay the balance by invoice instead).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_autocharge_disabled BOOLEAN NOT NULL DEFAULT FALSE;
