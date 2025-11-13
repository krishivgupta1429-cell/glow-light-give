-- Add database constraints for data integrity on form_submissions table
ALTER TABLE public.form_submissions
  ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT full_name_length CHECK (char_length(full_name) BETWEEN 1 AND 100),
  ADD CONSTRAINT comments_length CHECK (comments IS NULL OR char_length(comments) <= 2000);

-- Add database constraints for data integrity on donations table
ALTER TABLE public.donations
  ADD CONSTRAINT positive_amount CHECK (amount_cents > 0),
  ADD CONSTRAINT valid_status CHECK (status IN ('not_required', 'pending', 'succeeded', 'failed'));