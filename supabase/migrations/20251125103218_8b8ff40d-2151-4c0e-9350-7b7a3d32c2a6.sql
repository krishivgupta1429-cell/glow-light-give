-- Ensure created_at has the correct default and is NOT NULL
ALTER TABLE public.form_submissions 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

-- Create an index for efficient ordering by created_at
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at 
  ON public.form_submissions(created_at DESC);

-- Add a comment to document the ordering strategy
COMMENT ON COLUMN public.form_submissions.created_at IS 'Primary timestamp for ordering submissions chronologically. Always use ORDER BY created_at DESC for listing.';