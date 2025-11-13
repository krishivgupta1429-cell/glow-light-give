import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPONSORSHIP_AMOUNTS: Record<string, number> = {
  "doughnut": 36,
  "doughnut-gold": 72,
  "doughnut-platinum": 108,
  "menorah": 180,
  "menorah-gold": 360,
  "menorah-platinum": 540,
};

const CAN_OPTIONS = [
  { quantity: 1, amount: 4 },
  { quantity: 2, amount: 8 },
  { quantity: 4, amount: 16 },
  { quantity: 6, amount: 24 },
  { quantity: 8, amount: 32 },
  { quantity: 10, amount: 40 },
  { quantity: 15, amount: 60 },
  { quantity: 20, amount: 80 },
  { quantity: 30, amount: 120 },
  { quantity: 40, amount: 160 },
  { quantity: 50, amount: 200 },
  { quantity: 100, amount: 400 },
];

const RequestSchema = z.object({
  sponsorshipIds: z.array(z.string()),
  cansQuantity: z.number().int().min(0).optional(),
  fullName: z.string().min(1),
  email: z.string().email(),
  areaCode: z.string(),
  phoneNumber: z.string(),
  reason: z.string(),
  otherReason: z.string().optional(),
  comments: z.string().optional(),
  emailUpdatesOptIn: z.boolean(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('[CREATE-CHECKOUT] Missing STRIPE_SECRET_KEY');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const body = await req.json();
    const validatedData = RequestSchema.parse(body);

    // Calculate server-side total
    let totalAmountUsd = 0;

    // Add sponsorship amounts
    for (const sponsorshipId of validatedData.sponsorshipIds) {
      const amount = SPONSORSHIP_AMOUNTS[sponsorshipId];
      if (!amount) {
        throw new Error(`Invalid sponsorship ID: ${sponsorshipId}`);
      }
      totalAmountUsd += amount;
    }

    // Add cans amount
    if (validatedData.cansQuantity) {
      const canOption = CAN_OPTIONS.find(opt => opt.quantity === validatedData.cansQuantity);
      if (!canOption) {
        throw new Error(`Invalid cans quantity: ${validatedData.cansQuantity}`);
      }
      totalAmountUsd += canOption.amount;
    }

    if (totalAmountUsd <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const totalAmountCents = Math.round(totalAmountUsd * 100);

    console.log('[CREATE-CHECKOUT] Creating session', {
      totalAmountUsd,
      totalAmountCents,
      sponsorships: validatedData.sponsorshipIds,
      cans: validatedData.cansQuantity,
    });

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });

    const origin = req.headers.get('origin') || 'http://localhost:8080';
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Light the Way Donation',
              description: validatedData.sponsorshipIds.length > 0 
                ? `Sponsorships: ${validatedData.sponsorshipIds.join(', ')}${validatedData.cansQuantity ? ` + ${validatedData.cansQuantity} cans` : ''}`
                : `${validatedData.cansQuantity} cans`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?status=success`,
      cancel_url: `${origin}/?status=cancelled`,
      metadata: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        areaCode: validatedData.areaCode,
        phoneNumber: validatedData.phoneNumber,
        reason: validatedData.reason,
        otherReason: validatedData.otherReason || '',
        comments: validatedData.comments || '',
        emailUpdatesOptIn: String(validatedData.emailUpdatesOptIn),
        sponsorshipIds: validatedData.sponsorshipIds.join(','),
        cansQuantity: String(validatedData.cansQuantity || 0),
        totalAmountUsd: String(totalAmountUsd),
      },
    });

    console.log('[CREATE-CHECKOUT] Session created', { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[CREATE-CHECKOUT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
