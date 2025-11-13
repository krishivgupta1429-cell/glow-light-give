-- Add separate area_code and phone_number columns to form_submissions
ALTER TABLE form_submissions 
ADD COLUMN area_code text,
ADD COLUMN phone_number text;

-- Update existing phone data if any exists (split into area code and number)
-- This is a best-effort migration for existing data
UPDATE form_submissions 
SET area_code = CASE 
  WHEN phone IS NOT NULL AND phone LIKE '+%' THEN 
    substring(phone from 1 for POSITION(' ' IN phone || ' ') - 1)
  ELSE '+1'
END,
phone_number = CASE
  WHEN phone IS NOT NULL AND phone LIKE '+%' THEN 
    regexp_replace(substring(phone from POSITION(' ' IN phone || ' ')), '[^0-9]', '', 'g')
  WHEN phone IS NOT NULL THEN
    regexp_replace(phone, '[^0-9]', '', 'g')
  ELSE NULL
END
WHERE phone IS NOT NULL;