# Quick Start - Database Integration

## 🚀 Get Your Form Saving to Database in 3 Steps

### Step 1: Apply the Database Migration

Go to your Supabase SQL Editor and run the migration:

**🔗 Direct Link:** https://supabase.com/dashboard/project/tiewnnskjyvnyqfbszev/sql

1. Click **"New Query"**
2. Copy everything from `supabase/migrations/20250113000000_create_menorah_entries.sql`
3. Paste and click **"Run"** (or Cmd+Enter)

You should see "Success. No rows returned"

### Step 2: Verify the Table Was Created

**🔗 Direct Link:** https://supabase.com/dashboard/project/tiewnnskjyvnyqfbszev/editor

1. Go to **Table Editor**
2. Look for **menorah_entries** in the left sidebar
3. You should see an empty table with all the columns

### Step 3: Test Your Form

```bash
# Start your dev server
npm run dev
```

1. Open http://localhost:5173 (or your port)
2. Fill out the form
3. Click "Submit Entry"
4. Check browser console for: `Created menorah_entries row with id: ...`
5. Go back to Supabase Table Editor to see your entry!

## ✅ That's It!

Your form is now saving every submission to the database. No code changes needed - everything is already wired up.

## 📊 View Your Submissions

**🔗 Direct Link:** https://supabase.com/dashboard/project/tiewnnskjyvnyqfbszev/editor/menorah_entries

- See all form submissions in real-time
- Filter by lamplighter_eligible to see donors
- Export to CSV for analysis

## Need Help?

- See `IMPLEMENTATION_SUMMARY.md` for full details
- See `DATABASE_MIGRATION.md` for alternative migration methods
- Check browser console for error messages
