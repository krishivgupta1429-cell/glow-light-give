-- Create menorah_entries table
CREATE TABLE IF NOT EXISTS menorah_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Basic contact info
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,

  -- Raffle & survey
  enjoy_reason text NOT NULL,
  other_enjoy_reason text,

  -- Sponsorship / donations
  sponsorship_level text,
  sponsorship_amount_usd numeric DEFAULT 0 NOT NULL,
  cans_option text,
  cans_amount_usd numeric DEFAULT 0 NOT NULL,
  total_amount_usd numeric DEFAULT 0 NOT NULL,

  -- Other fields
  comments text,
  wants_email_updates boolean DEFAULT false NOT NULL,
  lamplighter_eligible boolean DEFAULT false NOT NULL,
  raw_form_json jsonb
);

-- Add index on created_at for better query performance
CREATE INDEX IF NOT EXISTS menorah_entries_created_at_idx ON menorah_entries (created_at DESC);

-- Add index on email for lookups
CREATE INDEX IF NOT EXISTS menorah_entries_email_idx ON menorah_entries (email);

-- Add index on lamplighter_eligible to filter easily
CREATE INDEX IF NOT EXISTS menorah_entries_lamplighter_idx ON menorah_entries (lamplighter_eligible) WHERE lamplighter_eligible = true;

-- Enable Row Level Security
ALTER TABLE menorah_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for public form submissions)
CREATE POLICY "Allow public inserts" ON menorah_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated users to read all entries (for admin access)
CREATE POLICY "Allow authenticated reads" ON menorah_entries
  FOR SELECT
  TO authenticated
  USING (true);
