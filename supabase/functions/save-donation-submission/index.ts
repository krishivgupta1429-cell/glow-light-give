import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const FormDataSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  areaCode: z.string().regex(/^\d{3}$/).optional(),
  phoneNumber: z.string().regex(/^\d{7}$/).optional(),
  enjoyReason: z.string().min(1),
  otherEnjoyReason: z.string().max(500).optional(),
  sponsorships: z.number().int().min(0),
  comments: z.string().max(2000).optional(),
  wantsEmailUpdates: z.boolean().optional(),
  cansQuantity: z.number().int().min(0).optional(),
  sponsorshipLevel: z.string().optional(),
});

const SPONSORSHIP_AMOUNTS: Record<string, number> = {
  'DOUGHNUT_BRONZE': 3600,
  'DOUGHNUT_SILVER': 7200,
  'DOUGHNUT_GOLD': 10800,
  'MENORAH_BRONZE': 18000,
  'MENORAH_SILVER': 36000,
  'MENORAH_GOLD': 54000,
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const key = `submission:${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip, 5, 60)) {
    console.warn('[SAVE-DONATION-SUBMISSION] Rate limit exceeded', { ip });
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429 
      }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { formData, submissionId, paymentIntentId, isDonor } = await req.json();

    console.log('[SAVE-DONATION-SUBMISSION] Request received', { submissionId, isDonor });

    // Validate input
    const validatedData = FormDataSchema.parse(formData);

    // Generate full phone in E.164 format
    const fullPhone = validatedData.areaCode && validatedData.phoneNumber 
      ? `${validatedData.areaCode}${validatedData.phoneNumber}` 
      : null;

    // Save form submission
    const { data: submission, error: submissionError } = await supabaseClient
      .from('form_submissions')
      .insert({
        full_name: validatedData.fullName.trim(),
        email: validatedData.email.trim().toLowerCase(),
        area_code: validatedData.areaCode?.trim() || null,
        phone_number: validatedData.phoneNumber?.trim() || null,
        phone: fullPhone,
        reason: validatedData.enjoyReason,
        reason_other: validatedData.otherEnjoyReason?.trim() || null,
        sponsorships: validatedData.sponsorships,
        comments: validatedData.comments?.trim() || null,
        email_updates_opt_in: validatedData.wantsEmailUpdates || false,
        cans_quantity: validatedData.cansQuantity || 0,
        email_verified: false,
        is_donor: isDonor,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('[SAVE-DONATION-SUBMISSION] Error saving submission:', submissionError);
      throw submissionError;
    }

    console.log('[SAVE-DONATION-SUBMISSION] Submission saved', { id: submission.id });

    // If this is a donor, create donation record with verified amount
    if (isDonor && validatedData.sponsorshipLevel && paymentIntentId) {
      // Verify the amount with Stripe
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        throw new Error('STRIPE_SECRET_KEY not configured');
      }
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify the amount matches the sponsorship level
      const expectedAmount = SPONSORSHIP_AMOUNTS[validatedData.sponsorshipLevel];
      if (paymentIntent.amount !== expectedAmount) {
        console.error('[SAVE-DONATION-SUBMISSION] Amount mismatch', {
          paid: paymentIntent.amount,
          expected: expectedAmount,
          level: validatedData.sponsorshipLevel
        });
        throw new Error('Payment amount does not match sponsorship level');
      }

      // Use verified amount from Stripe, not client
      const { error: donationError } = await supabaseClient
        .from('donations')
        .insert({
          form_submission_id: submission.id,
          amount_cents: paymentIntent.amount,  // From Stripe, not client
          cans_amount_cents: 0,  // No separate cans amount
          sponsorship_level: validatedData.sponsorshipLevel,
          stripe_payment_intent_id: paymentIntentId,
          status: 'succeeded',
        });

      if (donationError) {
        console.error('[SAVE-DONATION-SUBMISSION] Error saving donation:', donationError);
        throw donationError;
      }

      console.log('[SAVE-DONATION-SUBMISSION] Donation saved with verified amount');
    }

    return new Response(
      JSON.stringify({ success: true, submissionId: submission.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[SAVE-DONATION-SUBMISSION] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});