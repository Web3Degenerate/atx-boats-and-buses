CREATE EXTENSION IF NOT EXISTS btree_gist;

/*
Diagnostic overlap checks to run manually before adding the constraint:

SELECT
  b1.id AS booking_id,
  b2.id AS overlapping_booking_id,
  b1.vehicle_id,
  b1.status AS booking_status,
  b2.status AS overlapping_booking_status,
  tsrange((b1.date + b1.start_time)::timestamp, (b1.end_date + b1.end_time + INTERVAL '120 minutes')::timestamp, '[)') AS booking_range,
  tsrange((b2.date + b2.start_time)::timestamp, (b2.end_date + b2.end_time + INTERVAL '120 minutes')::timestamp, '[)') AS overlapping_booking_range
FROM bookings b1
JOIN bookings b2
  ON b1.vehicle_id = b2.vehicle_id
 AND b1.id < b2.id
WHERE b1.status IN ('pending', 'confirmed')
  AND b2.status IN ('pending', 'confirmed')
  AND tsrange((b1.date + b1.start_time)::timestamp, (b1.end_date + b1.end_time + INTERVAL '120 minutes')::timestamp, '[)')
      && tsrange((b2.date + b2.start_time)::timestamp, (b2.end_date + b2.end_time + INTERVAL '120 minutes')::timestamp, '[)')
ORDER BY b1.vehicle_id, booking_range;

SELECT id, vehicle_id, status, date, start_time, end_date, end_time
FROM bookings
WHERE status IN ('pending', 'confirmed')
  AND (end_date + end_time + INTERVAL '120 minutes') <= (date + start_time);
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_blocked_range tsrange
  GENERATED ALWAYS AS (
    tsrange(
      (date + start_time)::timestamp,
      (end_date + end_time + INTERVAL '120 minutes')::timestamp,
      '[)'
    )
  ) STORED;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'bookings'::regclass
      AND conname = 'bookings_vehicle_active_blocked_range_excl'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_vehicle_active_blocked_range_excl
      EXCLUDE USING gist (
        vehicle_id public.gist_uuid_ops WITH =,
        booking_blocked_range WITH &&
      )
      WHERE (status IN ('pending', 'confirmed'));
  END IF;
END;
$$;
