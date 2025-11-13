#!/usr/bin/env node

/**
 * Script to apply the menorah_entries migration to Lovable Cloud (Supabase)
 *
 * This script reads the migration file and executes it against your Supabase database.
 * Run with: node scripts/apply-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250113000000_create_menorah_entries.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration to Supabase...');
    console.log('⚠️  Note: This uses the anon key which may not have sufficient permissions.');
    console.log('   If this fails, please use the Supabase Dashboard SQL Editor instead.');
    console.log('');

    // Note: The anon key typically doesn't have permissions to run DDL statements
    // This will likely fail, but we'll try anyway
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed (expected with anon key)');
      console.error('Error:', error.message);
      console.log('');
      console.log('📋 Please apply the migration manually using the Supabase Dashboard:');
      console.log('1. Go to: https://supabase.com/dashboard/project/tiewnnskjyvnyqfbszev/sql');
      console.log('2. Click "New Query"');
      console.log('3. Copy the contents of: supabase/migrations/20250113000000_create_menorah_entries.sql');
      console.log('4. Paste and click "Run"');
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('');
    console.log('📋 Please apply the migration manually using the Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tiewnnskjyvnyqfbszev/sql');
    console.log('2. Click "New Query"');
    console.log('3. Copy the contents of: supabase/migrations/20250113000000_create_menorah_entries.sql');
    console.log('4. Paste and click "Run"');
    process.exit(1);
  }
}

applyMigration();
