-- Add full_phone column to store E.164 format phone number
ALTER TABLE public.form_submissions
ADD COLUMN full_phone text;