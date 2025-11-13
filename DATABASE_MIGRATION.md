# Database Migration Instructions

## Applying the Menorah Entries Migration

This project uses Lovable Cloud (Supabase) for the database. To apply the migration and create the `menorah_entries` table:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/tiewnnskjyvnyqfbszev
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20250113000000_create_menorah_entries.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project (only needed once)
npx supabase link --project-ref tiewnnskjyvnyqfbszev

# Apply all migrations
npx supabase db push
```

### Verification

After running the migration, verify it worked:

1. Go to **Table Editor** in the Supabase dashboard
2. You should see the `menorah_entries` table
3. Check that all columns are present

### Testing the Integration

1. Start the dev server: `npm run dev`
2. Fill out the form on the homepage
3. Submit the form
4. Check the browser console for the log message: "Created menorah_entries row with id: ..."
5. Go to the Supabase dashboard > Table Editor > menorah_entries to see your test data

## Table Schema

The `menorah_entries` table includes:
- Basic contact info (name, email, phone)
- Survey responses (enjoy_reason, other_enjoy_reason)
- Sponsorship details (sponsorship_level, sponsorship_amount_usd)
- Cans donation (cans_option, cans_amount_usd)
- Total donation amount
- Email opt-in preference
- Lamplighter eligibility flag
- Raw form JSON backup
