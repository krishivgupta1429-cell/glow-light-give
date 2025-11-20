import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Checkout session completed:", session.id);
      console.log("Metadata:", session.metadata);

      const formSubmissionId = session.metadata?.form_submission_id;
      
      if (!formSubmissionId) {
        console.error("No form_submission_id in metadata");
        return new Response(JSON.stringify({ error: "No form_submission_id" }), {
          status: 400,
        });
      }

      // Initialize Supabase client with service role key
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Get payment intent to extract charge details
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string
      );

      const amountInCents = session.amount_total || 0;

      console.log("Updating payment status for submission:", formSubmissionId);

      // Update form submission with payment success and Stripe details
      const { error: updateError } = await supabaseAdmin
        .from("form_submissions")
        .update({
          is_donor: true,
          payment_status: "success",
          stripe_customer_id: session.customer as string,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntent.id,
          payment_amount_cents: amountInCents,
        })
        .eq("id", formSubmissionId);

      if (updateError) {
        console.error("Error updating form submission:", updateError);
        throw updateError;
      }

      console.log("Form submission payment status updated to success");
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
      }
    );
  }
});
