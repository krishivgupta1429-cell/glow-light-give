-- Add is_donor field to form_submissions
ALTER TABLE public.form_submissions 
ADD COLUMN IF NOT EXISTS is_donor boolean DEFAULT false;

-- Update donations status to use standardized values
-- Existing records with 'pending' will remain as is
-- New records will use: 'not_required', 'pending', 'succeeded', 'failed'

-- Add comment to document status values
COMMENT ON COLUMN public.donations.status IS 'Payment status: not_required, pending, succeeded, failed';