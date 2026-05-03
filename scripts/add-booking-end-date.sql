ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_date DATE;

UPDATE bookings
SET end_date = date
WHERE end_date IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'bookings'::regclass
      AND attname = 'end_date'
      AND NOT attnotnull
      AND NOT attisdropped
  ) THEN
    ALTER TABLE bookings ALTER COLUMN end_date SET NOT NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'bookings'::regclass
      AND conname = 'bookings_end_after_start_check'
      AND pg_get_constraintdef(oid) <> 'CHECK (((end_date > date) OR ((end_date = date) AND (end_time > start_time))))'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_end_after_start_check;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'bookings'::regclass
      AND conname = 'bookings_end_after_start_check'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_end_after_start_check
      CHECK ((end_date > date) OR (end_date = date AND end_time > start_time));
  END IF;
END;
$$;
