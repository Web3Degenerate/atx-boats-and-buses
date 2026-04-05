ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS optional_charge_label TEXT NOT NULL DEFAULT 'Fuel Charge';
