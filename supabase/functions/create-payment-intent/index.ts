import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sponsorshipLevel, formData, amount } = await req.json();

    console.log('[CREATE-PAYMENT-INTENT] Request received', { sponsorshipLevel, amount });

    // Use provided amount if available, otherwise use sponsorship level mapping
    let amountCents: number;
    if (amount) {
      amountCents = Math.round(amount); // Ensure it's an integer
    } else if (sponsorshipLevel) {
      amountCents = SPONSORSHIP_AMOUNTS[sponsorshipLevel];
      if (!amountCents) {
        throw new Error(`Invalid sponsorship level: ${sponsorshipLevel}`);
      }
    } else {
      throw new Error('Either amount or sponsorshipLevel must be provided');
    }

    // Validate amount is positive
    if (amountCents <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Validate required fields
    if (!formData?.fullName || !formData?.email) {
      throw new Error('Missing required fields: fullName and email');
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
        customer_name: formData.fullName,
        customer_email: formData.email,
      },
      description: `${sponsorshipLevel} Sponsorship - ${formData.fullName}`,
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