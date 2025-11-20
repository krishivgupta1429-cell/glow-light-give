import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    console.log("[VERIFY-PAYMENT] Starting verification for session:", session_id);

    if (!session_id) {
      throw new Error("Missing session_id parameter");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("[VERIFY-PAYMENT] Retrieved session:", {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      amount_total: session.amount_total,
    });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the form submission by checkout session ID
    const { data: submission, error: findError } = await supabaseAdmin
      .from("form_submissions")
      .select("id, wants_to_donate, payment_status")
      .eq("stripe_checkout_session_id", session_id)
      .maybeSingle();

    if (findError) {
      console.error("[VERIFY-PAYMENT] Error finding form submission:", findError);
      throw findError;
    }

    if (!submission) {
      console.error("[VERIFY-PAYMENT] No form submission found for session:", session_id);
      throw new Error("Form submission not found");
    }

    console.log("[VERIFY-PAYMENT] Found form submission:", submission.id);

    // Only update if wants_to_donate is true
    if (!submission.wants_to_donate) {
      console.log("[VERIFY-PAYMENT] Submission does not want to donate, skipping update");
      return new Response(
        JSON.stringify({
          payment_status: "none",
          message: "No donation requested",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get payment intent details if available
    let paymentIntentId = null;
    if (session.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );
        paymentIntentId = paymentIntent.id;
        console.log("[VERIFY-PAYMENT] Payment intent retrieved:", paymentIntentId);
      } catch (err) {
        console.error("[VERIFY-PAYMENT] Error retrieving payment intent:", err);
      }
    }

    // Determine payment status
    let paymentStatus = "pending";
    if (session.payment_status === "paid") {
      paymentStatus = "success";
    } else if (session.payment_status === "unpaid") {
      paymentStatus = "failed";
    }

    const amountInCents = session.amount_total || 0;

    console.log("[VERIFY-PAYMENT] Updating form submission with:", {
      payment_status: paymentStatus,
      amount: amountInCents,
      payment_intent: paymentIntentId,
    });

    // Update the form submission
    const { error: updateError } = await supabaseAdmin
      .from("form_submissions")
      .update({
        stripe_customer_id: session.customer as string || null,
        stripe_payment_intent_id: paymentIntentId,
        payment_amount_cents: amountInCents,
        payment_status: paymentStatus,
      })
      .eq("id", submission.id);

    if (updateError) {
      console.error("[VERIFY-PAYMENT] Error updating form submission:", updateError);
      throw updateError;
    }

    console.log("[VERIFY-PAYMENT] Successfully updated form submission to status:", paymentStatus);

    return new Response(
      JSON.stringify({
        payment_status: paymentStatus,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[VERIFY-PAYMENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
