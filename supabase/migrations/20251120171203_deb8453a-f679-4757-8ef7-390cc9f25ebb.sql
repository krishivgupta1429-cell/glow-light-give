-- Drop the RLS policy that references email_verified first
DROP POLICY IF EXISTS "Anyone can verify email with valid token" ON public.form_submissions;

-- Now drop unused columns from form_submissions table
ALTER TABLE public.form_submissions 
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS email_verified_at,
DROP COLUMN IF EXISTS phone;

-- Recreate the policy without email_verified check
CREATE POLICY "Anyone can verify email with valid token" 
ON public.form_submissions 
FOR UPDATE 
USING (verification_token IS NOT NULL)
WITH CHECK (verification_token IS NULL);