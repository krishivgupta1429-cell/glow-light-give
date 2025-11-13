import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sponsorship level to amount mapping (in cents)
const SPONSORSHIP_AMOUNTS: Record<string, number> = {
  'DOUGHNUT_BRONZE': 1800,  // $18
  'DOUGHNUT_SILVER': 3600,  // $36
  'DOUGHNUT_GOLD': 7200,    // $72
  'MENORAH_BRONZE': 18000,  // $180
  'MENORAH_SILVER': 36000,  // $360
  'MENORAH_GOLD': 72000,    // $720
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sponsorshipLevel, formData } = await req.json();

    console.log('[CREATE-PAYMENT-INTENT] Request received', { sponsorshipLevel });

    // Validate sponsorship level
    const amountCents = SPONSORSHIP_AMOUNTS[sponsorshipLevel];
    if (!amountCents) {
      throw new Error(`Invalid sponsorship level: ${sponsorshipLevel}`);
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});