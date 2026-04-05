-- Waiver System Migration
-- Electronic waiver signing for ATX Boats and Buses

-- 1. Waiver templates — stores waiver text per vehicle type
CREATE TABLE IF NOT EXISTS waiver_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Waiver links — one per booking, holds the shareable token
CREATE TABLE IF NOT EXISTS waiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  trip_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Signed waivers — one record per signer (adult or guardian)
CREATE TABLE IF NOT EXISTS signed_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_link_id UUID NOT NULL REFERENCES waiver_links(id) ON DELETE CASCADE,
  signer_type TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  esign_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  pdf_data BYTEA,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Waiver minors — one per minor covered by a guardian's signature
CREATE TABLE IF NOT EXISTS waiver_minors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signed_waiver_id UUID NOT NULL REFERENCES signed_waivers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  date_of_birth DATE NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL
);

-- 5. Waiver reminders sent — track sent reminders to prevent duplicates
CREATE TABLE IF NOT EXISTS waiver_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_link_id UUID NOT NULL REFERENCES waiver_links(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (waiver_link_id, reminder_type)
);

-- 6. Insert placeholder waiver templates
INSERT INTO waiver_templates (vehicle_type, title, body)
VALUES
  ('party-boat', 'Boat Rental Liability Waiver', '[BOAT WAIVER TEXT PLACEHOLDER — Replace with actual waiver language]'),
  ('party-bus', 'Bus Rental Liability Waiver', '[BUS WAIVER TEXT PLACEHOLDER — Replace with actual waiver language]')
ON CONFLICT (vehicle_type) DO NOTHING;
