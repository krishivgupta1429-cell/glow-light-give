-- Add new columns for Menorah Parade questions
ALTER TABLE public.form_submissions
ADD COLUMN IF NOT EXISTS drive_in_parade text,
ADD COLUMN IF NOT EXISTS car_menorah_preference text;

-- Add constraints to ensure valid values
ALTER TABLE public.form_submissions
ADD CONSTRAINT valid_drive_in_parade CHECK (drive_in_parade IS NULL OR drive_in_parade IN ('yes', 'no')),
ADD CONSTRAINT valid_car_menorah_preference CHECK (car_menorah_preference IS NULL OR car_menorah_preference IN ('own', 'borrow'));

