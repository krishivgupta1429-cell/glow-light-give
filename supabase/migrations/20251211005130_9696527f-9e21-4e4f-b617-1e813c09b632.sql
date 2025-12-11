-- Fix: Restrict donations INSERT to admin only (was allowing anyone to insert)
DROP POLICY IF EXISTS "Anyone can insert donations" ON public.donations;

CREATE POLICY "Only admins can insert donations"
ON public.donations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));