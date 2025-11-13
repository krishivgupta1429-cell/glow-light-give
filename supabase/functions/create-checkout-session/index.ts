import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPONSORSHIP_AMOUNTS: Record<string, number> = {
  'doughnut': 36,
  'doughnut-gold': 72,
  'doughnut-platinum': 108,
  'menorah': 180,
  'menorah-gold': 360,
  'menorah-platinum': 540,
};

const RequestSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  areaCode: z.string(),
  phoneNumber: z.string(),
  reason: z.string().min(1),
  otherReason: z.string().optional(),
  sponsorships: z.array(z.string()),
  cansQuantity: z.string().optional(),
  comments: z.string().max(2000).optional(),
  emailUpdatesOptIn: z.boolean().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const body = await req.json();
    console.log('[CREATE-CHECKOUT] Request received');

    const validatedData = RequestSchema.parse(body);

    // Calculate total amount on server
    let totalAmountCents = 0;

    // Add sponsorship amounts
    for (const sponsorshipId of validatedData.sponsorships) {
      const amount = SPONSORSHIP_AMOUNTS[sponsorshipId];
      if (amount) {
        totalAmountCents += amount * 100; // Convert to cents
      }
    }

    // Add cans amount
    if (validatedData.cansQuantity) {
      const canOption = validatedData.cansQuantity.match(/(\d+)\s*CAN/i);
      if (canOption) {
        const quantity = parseInt(canOption[1]);
        totalAmountCents += quantity * 4 * 100; // $4 per can in cents
      }
    }

    if (totalAmountCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'No sponsorship or cans selected' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-CHECKOUT] Total amount:', totalAmountCents / 100, 'USD');

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });

    const origin = req.headers.get('origin') || 'http://localhost:8080';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalAmountCents,
            product_data: {
              name: 'Menorah Celebration Sponsorship',
              description: `Sponsorships: ${validatedData.sponsorships.join(', ')}${validatedData.cansQuantity ? `, Cans: ${validatedData.cansQuantity}` : ''}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
      metadata: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        areaCode: validatedData.areaCode,
        phoneNumber: validatedData.phoneNumber,
        reason: validatedData.reason,
        otherReason: validatedData.otherReason || '',
        sponsorships: validatedData.sponsorships.join(','),
        cansQuantity: validatedData.cansQuantity || '',
        comments: validatedData.comments || '',
        emailUpdatesOptIn: validatedData.emailUpdatesOptIn ? 'true' : 'false',
      },
    });

    console.log('[CREATE-CHECKOUT] Session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[CREATE-CHECKOUT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
