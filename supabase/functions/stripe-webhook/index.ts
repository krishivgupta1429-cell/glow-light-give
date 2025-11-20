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
    
    console.log("Webhook signature verification starting...");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("Webhook signature verified successfully");
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
      });
    }

    console.log("Webhook event received:", event.type, "Event ID:", event.id);

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Checkout session completed:", session.id);
      console.log("Payment status:", session.payment_status);
      console.log("Metadata:", session.metadata);

      const formSubmissionId = session.metadata?.form_submission_id;
      
      if (!formSubmissionId) {
        console.error("No form_submission_id in metadata");
        return new Response(JSON.stringify({ error: "No form_submission_id" }), {
          status: 400,
        });
      }

      // Get payment intent to extract charge details
      let paymentIntentId = null;
      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string
          );
          paymentIntentId = paymentIntent.id;
          console.log("Payment intent retrieved:", paymentIntentId);
        } catch (err) {
          console.error("Error retrieving payment intent:", err);
        }
      }

      const amountInCents = session.amount_total || 0;

      console.log("Updating form_submissions for:", formSubmissionId, "with amount:", amountInCents);

      // Update form submission with payment success and Stripe details
      const { error: updateError } = await supabaseAdmin
        .from("form_submissions")
        .update({
          is_donor: true,
          payment_status: session.payment_status === "paid" ? "success" : "pending",
          stripe_customer_id: session.customer as string || null,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          payment_amount_cents: amountInCents,
        })
        .eq("id", formSubmissionId);

      if (updateError) {
        console.error("Error updating form_submissions:", updateError);
        throw updateError;
      }

      console.log("Form submission updated successfully to status:", session.payment_status === "paid" ? "success" : "pending");
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("Payment intent succeeded:", paymentIntent.id);

      // Find the form submission by payment intent ID
      const { data: submission, error: findError } = await supabaseAdmin
        .from("form_submissions")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (findError) {
        console.error("Error finding form submission:", findError);
      } else if (submission) {
        const { error: updateError } = await supabaseAdmin
          .from("form_submissions")
          .update({
            payment_status: "success",
            payment_amount_cents: paymentIntent.amount,
          })
          .eq("id", submission.id);

        if (updateError) {
          console.error("Error updating payment status to success:", updateError);
        } else {
          console.log("Payment status updated to success for submission:", submission.id);
        }
      } else {
        console.log("No submission found for payment intent:", paymentIntent.id);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("Payment intent failed:", paymentIntent.id);

      // Find the form submission by payment intent ID
      const { data: submission, error: findError } = await supabaseAdmin
        .from("form_submissions")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (findError) {
        console.error("Error finding form submission:", findError);
      } else if (submission) {
        const { error: updateError } = await supabaseAdmin
          .from("form_submissions")
          .update({
            payment_status: "fail",
          })
          .eq("id", submission.id);

        if (updateError) {
          console.error("Error updating payment status to fail:", updateError);
        } else {
          console.log("Payment status updated to fail for submission:", submission.id);
        }
      } else {
        console.log("No submission found for payment intent:", paymentIntent.id);
      }
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
