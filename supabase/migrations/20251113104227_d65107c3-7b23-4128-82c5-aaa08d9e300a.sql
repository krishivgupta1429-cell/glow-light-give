-- Add email verification fields to form_submissions table
ALTER TABLE public.form_submissions 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS verification_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS wants_to_donate boolean DEFAULT false;

-- Create index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_submissions_verification_token 
ON public.form_submissions(verification_token) 
WHERE verification_token IS NOT NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_submissions_email 
ON public.form_submissions(email);

-- Create a policy to allow public verification token lookups (needed for email verification)
CREATE POLICY "Anyone can verify email with valid token" 
ON public.form_submissions 
FOR UPDATE 
USING (verification_token IS NOT NULL AND email_verified = false)
WITH CHECK (email_verified = true);