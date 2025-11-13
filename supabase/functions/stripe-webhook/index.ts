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

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('[STRIPE-WEBHOOK] Checkout completed:', { 
        id: session.id, 
        metadata: session.metadata 
      });

      const metadata = session.metadata || {};
      const sponsorships = metadata.sponsorships ? metadata.sponsorships.split(',') : [];
      
      // Calculate amounts
      let totalAmountCents = 0;
      for (const sponsorshipId of sponsorships) {
        const amounts: Record<string, number> = {
          'doughnut': 36,
          'doughnut-gold': 72,
          'doughnut-platinum': 108,
          'menorah': 180,
          'menorah-gold': 360,
          'menorah-platinum': 540,
        };
        const amount = amounts[sponsorshipId];
        if (amount) {
          totalAmountCents += amount * 100;
        }
      }

      // Add cans amount
      if (metadata.cansQuantity) {
        const canOption = metadata.cansQuantity.match(/(\d+)\s*CAN/i);
        if (canOption) {
          const quantity = parseInt(canOption[1]);
          totalAmountCents += quantity * 4 * 100;
        }
      }

      // Create database client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      // Generate full phone
      const fullPhone = metadata.areaCode && metadata.phoneNumber 
        ? `${metadata.areaCode}${metadata.phoneNumber}` 
        : null;

      // Parse cans quantity from label
      let cansQuantity = 0;
      if (metadata.cansQuantity) {
        const canOption = metadata.cansQuantity.match(/(\d+)\s*CAN/i);
        if (canOption) {
          cansQuantity = parseInt(canOption[1]);
        }
      }

      // Save form submission
      const { data: submission, error: submissionError } = await supabaseClient
        .from('form_submissions')
        .insert({
          full_name: metadata.fullName,
          email: metadata.email.toLowerCase(),
          area_code: metadata.areaCode || null,
          phone_number: metadata.phoneNumber || null,
          phone: fullPhone,
          reason: metadata.reason,
          reason_other: metadata.otherReason || null,
          sponsorships: sponsorships.length,
          comments: metadata.comments || null,
          email_updates_opt_in: metadata.emailUpdatesOptIn === 'true',
          cans_quantity: cansQuantity,
          email_verified: false,
          is_donor: true,
        })
        .select()
        .single();

      if (submissionError) {
        console.error('[STRIPE-WEBHOOK] Error creating submission:', submissionError);
        return new Response(JSON.stringify({ error: 'Failed to save submission' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      console.log('[STRIPE-WEBHOOK] Submission created:', submission.id);

      // Create donation record
      const { error: donationError } = await supabaseClient
        .from('donations')
        .insert({
          form_submission_id: submission.id,
          amount_cents: totalAmountCents,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'succeeded',
        });

      if (donationError) {
        console.error('[STRIPE-WEBHOOK] Error creating donation:', donationError);
      } else {
        console.log('[STRIPE-WEBHOOK] Donation saved successfully');
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