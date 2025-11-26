-- Remove old cans and comments columns
ALTER TABLE form_submissions DROP COLUMN IF EXISTS cans_quantity;
ALTER TABLE form_submissions DROP COLUMN IF EXISTS comments;

-- Add new parade-related columns
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS drive_in_parade text;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS car_menorah_preference text;