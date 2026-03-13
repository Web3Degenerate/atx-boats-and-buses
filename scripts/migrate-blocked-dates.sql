ALTER TABLE blocked_dates
  ADD COLUMN start_date DATE,
  ADD COLUMN start_time TIME,
  ADD COLUMN end_date DATE,
  ADD COLUMN end_time TIME;

UPDATE blocked_dates
SET start_date = date,
    start_time = '00:00',
    end_date = date,
    end_time = '23:59';

ALTER TABLE blocked_dates
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL,
  ALTER COLUMN end_time SET NOT NULL;

ALTER TABLE blocked_dates DROP CONSTRAINT blocked_dates_vehicle_id_date_key;
ALTER TABLE blocked_dates DROP COLUMN date;
