CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  price_per_hour INTEGER NOT NULL,
  minimum_hours INTEGER NOT NULL,
  fuel_charge_percent INTEGER NOT NULL DEFAULT 0,
  features JSON NOT NULL,
  images JSON NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  guest_count INTEGER NOT NULL,
  notes TEXT,
  total_price INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, date)
);

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value VARCHAR NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO vehicles (
  name,
  slug,
  type,
  description,
  capacity,
  price_per_hour,
  minimum_hours,
  fuel_charge_percent,
  features,
  images
)
VALUES
  (
    '45 Foot Prevost Tour Bus',
    'prevost-tour-bus',
    'party-bus',
    'Our flagship 45-foot Prevost Tour Bus comfortably seats 23 guests and comes equipped with a private bathroom. Perfect for bachelor/bachelorette parties, corporate events, and Austin city tours.',
    23,
    40000,
    3,
    20,
    '["Private Bathroom", "23 Guest Capacity", "Premium Sound System", "LED Party Lighting", "Climate Controlled"]'::json,
    '["/images/bus-1.jpg", "/images/bus-2.jpg"]'::json
  ),
  (
    '36 Foot Executive Shuttle',
    'executive-shuttle',
    'party-bus',
    'Our 36-foot Executive Shuttle seats up to 25 guests with a private bathroom. Ideal for group transportation, weddings, and special events around Austin.',
    25,
    25000,
    3,
    0,
    '["Private Bathroom", "25 Guest Capacity", "Comfortable Seating", "Climate Controlled"]'::json,
    '["/images/bus-3.jpg", "/images/bus-4.jpg"]'::json
  ),
  (
    '50 Foot Carver Yacht',
    'carver-yacht',
    'party-boat',
    'Our stunning 50-foot Carver Yacht accommodates up to 20 guests on Lake Travis. The ultimate luxury experience for parties, celebrations, and sunset cruises.',
    20,
    70000,
    3,
    0,
    '["20 Guest Capacity", "Full Sun Deck", "Premium Sound System", "Swim Platform"]'::json,
    '["/images/boat-1.jpg", "/images/boat-2.jpg"]'::json
  ),
  (
    '38 Foot Cruiser Yacht',
    'cruiser-yacht',
    'party-boat',
    'Our 38-foot Cruiser Yacht is perfect for intimate gatherings of up to 20 guests on Lake Travis. Great for sunset cruises, birthday parties, and corporate outings.',
    20,
    35000,
    3,
    0,
    '["20 Guest Capacity", "Open Deck Layout", "Bluetooth Audio", "Swim Platform"]'::json,
    '["/images/boat-3.jpg", "/images/boat-4.jpg"]'::json
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_settings (key, value)
VALUES ('fuel_charge_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
