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
  'doughnut': 3600,  // $36
  'doughnut-gold': 7200,  // $72
  'doughnut-platinum': 10800,   // $108
  'menorah': 18000,  // $180
  'menorah-gold': 36000,  // $360
  'menorah-platinum': 54000,    // $540
};

// Input validation schema
const RequestSchema = z.object({
  sponsorshipIds: z.array(z.string()).min(1, 'At least one sponsorship must be selected'),
  cansQuantity: z.number().int().min(0).optional(),
  formData: z.object({
    fullName: z.string().min(1).max(100),
    email: z.string().email().max(255),
  }),
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

    const requestData = await req.json();
    console.log('[CREATE-PAYMENT-INTENT] Request received', { 
      sponsorshipIds: requestData.sponsorshipIds,
      cansQuantity: requestData.cansQuantity 
    });

    // Validate input
    const { sponsorshipIds, cansQuantity, formData } = RequestSchema.parse(requestData);

    // Calculate total amount from server-side prices
    let totalAmountCents = 0;
    
    // Add sponsorship amounts
    for (const id of sponsorshipIds) {
      const amount = SPONSORSHIP_AMOUNTS[id];
      if (!amount) {
        throw new Error(`Invalid sponsorship ID: ${id}`);
      }
      totalAmountCents += amount;
    }

    // Cans are $4 each (400 cents)
    if (cansQuantity && cansQuantity > 0) {
      totalAmountCents += cansQuantity * 400;
    }

    if (totalAmountCents <= 0) {
      throw new Error('Total amount must be greater than zero');
    }

    console.log('[CREATE-PAYMENT-INTENT] Calculated amount', { 
      sponsorshipIds,
      cansQuantity,
      totalAmountCents 
    });

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
      amount: totalAmountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        submission_id: submissionId,
        sponsorship_ids: sponsorshipIds.join(','),
        cans_quantity: cansQuantity?.toString() || '0',
        expected_amount: totalAmountCents.toString(),
        customer_name: formData.fullName,
        customer_email: formData.email,
      },
      description: `Sponsorship - ${formData.fullName}`,
    });

    console.log('[CREATE-PAYMENT-INTENT] PaymentIntent created', { 
      id: paymentIntent.id, 
      amount: totalAmountCents,
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