-- Add payment_status column to form_submissions table
ALTER TABLE public.form_submissions 
ADD COLUMN payment_status text DEFAULT 'pending';

-- Add a check constraint to ensure valid payment_status values
ALTER TABLE public.form_submissions
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'success', 'fail', 'none'));

-- Add columns to store Stripe payment information in form_submissions
ALTER TABLE public.form_submissions
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_checkout_session_id text,
ADD COLUMN stripe_payment_intent_id text,
ADD COLUMN payment_amount_cents integer DEFAULT 0;