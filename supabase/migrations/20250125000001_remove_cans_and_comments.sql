-- Remove cans_quantity and comments columns from form_submissions table
-- These fields are no longer used in the form

-- Drop the constraint that references comments column first
ALTER TABLE public.form_submissions
DROP CONSTRAINT IF EXISTS comments_length;

-- Drop the columns
ALTER TABLE public.form_submissions
DROP COLUMN IF EXISTS cans_quantity,
DROP COLUMN IF EXISTS comments;

