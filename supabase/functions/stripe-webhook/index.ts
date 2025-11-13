import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!stripeKey || !webhookSecret) {
    console.error('[STRIPE-WEBHOOK] Missing Stripe keys');
    return new Response('Configuration error', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('[STRIPE-WEBHOOK] Missing signature');
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('[STRIPE-WEBHOOK] Event received', { type: event.type });

    // Handle payment_intent events
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const status = event.type === 'payment_intent.succeeded' ? 'succeeded' : 'failed';

      console.log('[STRIPE-WEBHOOK] Payment status:', { 
        id: paymentIntent.id, 
        status,
        metadata: paymentIntent.metadata 
      });

      // Update donation status in database
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      const { error } = await supabaseClient
        .from('donations')
        .update({ status })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (error) {
        console.error('[STRIPE-WEBHOOK] Error updating donation:', error);
      } else {
        console.log('[STRIPE-WEBHOOK] Donation updated successfully');
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});