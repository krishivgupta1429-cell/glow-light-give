import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sponsorship level to amount mapping (in cents)
const SPONSORSHIP_AMOUNTS: Record<string, number> = {
  'DOUGHNUT_BRONZE': 3600,  // $36
  'DOUGHNUT_SILVER': 7200,  // $72
  'DOUGHNUT_GOLD': 10800,   // $108
  'MENORAH_BRONZE': 18000,  // $180
  'MENORAH_SILVER': 36000,  // $360
  'MENORAH_GOLD': 54000,    // $540
};

// Input validation schema
const FormDataSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  areaCode: z.string().regex(/^\d{3}$/).optional(),
  phoneNumber: z.string().regex(/^\d{7}$/).optional(),
});

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const key = `payment:${ip}`;
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

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, 10, 60)) {
      console.warn('[CREATE-PAYMENT-INTENT] Rate limit exceeded', { ip });
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    const { sponsorshipLevel, formData } = await req.json();

    console.log('[CREATE-PAYMENT-INTENT] Request received', { sponsorshipLevel });

    // Validate input
    const validatedData = FormDataSchema.parse(formData);

    // ONLY use server-side mapping - never trust client amount
    const amountCents = SPONSORSHIP_AMOUNTS[sponsorshipLevel];
    if (!amountCents) {
      throw new Error(`Invalid sponsorship level: ${sponsorshipLevel}`);
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });

    // Generate a unique submission ID for tracking
    const submissionId = crypto.randomUUID();

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        submission_id: submissionId,
        sponsorship_level: sponsorshipLevel,
        expected_amount: amountCents.toString(),
        customer_name: validatedData.fullName,
        customer_email: validatedData.email,
      },
      description: `${sponsorshipLevel} Sponsorship - ${validatedData.fullName}`,
    });

    console.log('[CREATE-PAYMENT-INTENT] PaymentIntent created', { 
      id: paymentIntent.id, 
      amount: amountCents,
      submissionId 
    });

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        submissionId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[CREATE-PAYMENT-INTENT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});