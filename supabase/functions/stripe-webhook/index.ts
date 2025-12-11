import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK-LIVE] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("ERROR: No signature provided");
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
    });
  }

  try {
    // Verify environment variables are set
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      logStep("ERROR: Missing required environment variables", { 
        hasStripeKey: !!stripeKey, 
        hasWebhookSecret: !!webhookSecret 
      });
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
      });
    }

    logStep("Environment variables verified - Using LIVE mode keys");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    
    logStep("Webhook signature verification starting");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified successfully", { eventType: event.type });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logStep("ERROR: Webhook signature verification failed", { error });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
      });
    }

    logStep("Webhook event received", { type: event.type, id: event.id, livemode: event.livemode });

    // Verify this is a live mode event
    if (!event.livemode) {
      logStep("WARNING: Received test mode event in production", { eventId: event.id });
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Checkout session completed", { 
        sessionId: session.id, 
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        livemode: session.livemode
      });

      const formSubmissionId = session.metadata?.form_submission_id;
      
      if (!formSubmissionId) {
        logStep("ERROR: No form_submission_id in metadata", { sessionId: session.id });
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
          logStep("Payment intent retrieved", { paymentIntentId, status: paymentIntent.status });
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          logStep("ERROR: Failed to retrieve payment intent", { error });
        }
      }

      const amountInCents = session.amount_total || 0;

      // Determine payment status
      let paymentStatus = "pending";
      if (session.payment_status === "paid") {
        paymentStatus = "success";
      } else if (session.payment_status === "unpaid") {
        paymentStatus = "failed";
      }

      logStep("Updating form_submissions", { 
        formSubmissionId, 
        paymentStatus,
        amountInCents,
        paymentIntentId
      });

      // Update form submission with payment success and Stripe details
      const { error: updateError } = await supabaseAdmin
        .from("form_submissions")
        .update({
          is_donor: true,
          payment_status: paymentStatus,
          stripe_customer_id: session.customer as string || null,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          payment_amount_cents: amountInCents,
        })
        .eq("id", formSubmissionId);

      if (updateError) {
        logStep("ERROR: Failed to update form_submissions", { error: updateError });
        throw updateError;
      }

      logStep("Form submission updated successfully", { 
        formSubmissionId, 
        status: paymentStatus 
      });
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      logStep("Payment intent succeeded", { 
        paymentIntentId: paymentIntent.id, 
        amount: paymentIntent.amount,
        livemode: paymentIntent.livemode
      });

      // Find the form submission by payment intent ID
      const { data: submission, error: findError } = await supabaseAdmin
        .from("form_submissions")
        .select("id, payment_status")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (findError) {
        logStep("ERROR: Failed to find form submission", { 
          paymentIntentId: paymentIntent.id, 
          error: findError 
        });
      } else if (submission) {
        logStep("Found form submission for payment intent", { 
          submissionId: submission.id,
          currentStatus: submission.payment_status
        });

        const { error: updateError } = await supabaseAdmin
          .from("form_submissions")
          .update({
            payment_status: "success",
            payment_amount_cents: paymentIntent.amount,
            is_donor: true,
          })
          .eq("id", submission.id);

        if (updateError) {
          logStep("ERROR: Failed to update payment status to success", { 
            submissionId: submission.id, 
            error: updateError 
          });
        } else {
          logStep("Payment status updated to success", { submissionId: submission.id });
        }
      } else {
        logStep("WARNING: No submission found for payment intent", { 
          paymentIntentId: paymentIntent.id 
        });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      logStep("Payment intent failed", { 
        paymentIntentId: paymentIntent.id,
        failureMessage: paymentIntent.last_payment_error?.message,
        livemode: paymentIntent.livemode
      });

      // Find the form submission by payment intent ID
      const { data: submission, error: findError } = await supabaseAdmin
        .from("form_submissions")
        .select("id, payment_status")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (findError) {
        logStep("ERROR: Failed to find form submission", { 
          paymentIntentId: paymentIntent.id, 
          error: findError 
        });
      } else if (submission) {
        logStep("Found form submission for failed payment", { 
          submissionId: submission.id,
          currentStatus: submission.payment_status
        });

        const { error: updateError } = await supabaseAdmin
          .from("form_submissions")
          .update({
            payment_status: "failed",
          })
          .eq("id", submission.id);

        if (updateError) {
          logStep("ERROR: Failed to update payment status to failed", { 
            submissionId: submission.id, 
            error: updateError 
          });
        } else {
          logStep("Payment status updated to failed", { submissionId: submission.id });
        }
      } else {
        logStep("WARNING: No submission found for failed payment intent", { 
          paymentIntentId: paymentIntent.id 
        });
      }
    }

    logStep("Webhook processed successfully", { eventType: event.type, eventId: event.id });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    logStep("ERROR: Webhook processing failed", { 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 400,
      }
    );
  }
});
