-- Add attendance columns to form_submissions table
ALTER TABLE public.form_submissions 
ADD COLUMN number_of_adults integer,
ADD COLUMN number_of_children integer DEFAULT 0;