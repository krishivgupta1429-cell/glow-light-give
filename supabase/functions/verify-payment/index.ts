import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT-LIVE] ${step}${detailsStr}`);
};

// Send donation receipt email via Brevo API
async function sendDonationReceiptEmail(
  fullName: string,
  email: string,
  donationData: {
    amountCents: number;
    cansQuantity: number;
    sponsorships: string[];
    donationDate: string;
    transactionId: string;
  }
): Promise<void> {
  try {
    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) {
      throw new Error("Missing BREVO_API_KEY");
    }

    // Format amount from cents to dollars
    const amountDollars = donationData.amountCents / 100;
    const formattedAmount = Number.isInteger(amountDollars)
      ? `$${amountDollars}`
      : `$${amountDollars.toFixed(2)}`;

    // Format donation date
    const date = new Date(donationData.donationDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Build conditional bullets
    const bullets: string[] = [];
    
    // Amount with optional sponsorships
    if (donationData.sponsorships && donationData.sponsorships.length > 0) {
      const sponsorshipText = donationData.sponsorships.join(", ");
      bullets.push(`• ${formattedAmount} — ${sponsorshipText}`);
    } else {
      bullets.push(`• ${formattedAmount}`);
    }
    
    // Cans line (only if cans > 0)
    if (donationData.cansQuantity > 0) {
      bullets.push(`• ${donationData.cansQuantity} cans sponsored`);
    }
    
    // Date and transaction reference
    bullets.push(`• ${formattedDate}`);
    bullets.push(`• Ref: ${donationData.transactionId}`);

    const htmlContent = `Hi ${fullName},<br/><br/>
      Thank you for your generous donation to Menorah in the Square. You're helping us build the Menorah of Cans and supporting an amazing citywide event that brings light, joy, and unity to our community.<br/><br/>
      <strong>Donation Details</strong><br/>
      ${bullets.join("<br/>")}<br/><br/>
      We're grateful for your partnership in spreading light this Chanukah — both through giving and by making this beloved event possible.<br/><br/>
      With thanks,<br/>
      Rabbi Laibel & Chaya Shemtov`;

    const payload = {
      sender: { name: "Rabbi Laibel Shemtov", email: "rabbi@jewishtc.org" },
      to: [{ email, name: fullName }],
      bcc: [{ email: "laibelswb@gmail.com", name: "Rabbi Laibel" }],
      subject: "Thank You for Supporting Menorah in the Square!",
      htmlContent,
    };

    console.log(`[donation-email] Attempting to send donation receipt to ${email}...`);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }
    
    console.log(`[donation-email] Sent successfully to ${email}`);
  } catch (error) {
    console.error(`[donation-email] Error: ${error}`);
    // Don't throw - we don't want email failures to block payment verification
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    logStep("Starting payment verification", { sessionId: session_id });

    if (!session_id) {
      logStep("ERROR: Missing session_id parameter");
      throw new Error("Missing session_id parameter");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe not configured");
    }

    logStep("Using LIVE mode Stripe key");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved session from Stripe", {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      amount_total: session.amount_total,
      livemode: session.livemode,
    });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the form submission by checkout session ID
    const { data: submission, error: findError } = await supabaseAdmin
      .from("form_submissions")
      .select("id, wants_to_donate, payment_status, full_name, email, cans_quantity, sponsorships, created_at")
      .eq("stripe_checkout_session_id", session_id)
      .maybeSingle();

    if (findError) {
      logStep("ERROR: Failed to find form submission", { error: findError });
      throw findError;
    }

    if (!submission) {
      logStep("ERROR: No form submission found", { sessionId: session_id });
      throw new Error("Form submission not found");
    }

    logStep("Found form submission", { 
      submissionId: submission.id,
      wantsToDonate: submission.wants_to_donate,
      currentStatus: submission.payment_status
    });

    // Only update if wants_to_donate is true
    if (!submission.wants_to_donate) {
      logStep("Submission does not want to donate, skipping update", { 
        submissionId: submission.id 
      });
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
        logStep("Payment intent retrieved", { 
          paymentIntentId, 
          status: paymentIntent.status 
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logStep("ERROR: Failed to retrieve payment intent", { error });
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

    logStep("Preparing to update form submission", {
      submissionId: submission.id,
      paymentStatus,
      amountInCents,
      paymentIntentId,
    });

    // Update the form submission
    const { error: updateError } = await supabaseAdmin
      .from("form_submissions")
      .update({
        is_donor: paymentStatus === "success",
        stripe_customer_id: session.customer as string || null,
        stripe_payment_intent_id: paymentIntentId,
        payment_amount_cents: amountInCents,
        payment_status: paymentStatus,
      })
      .eq("id", submission.id);

    if (updateError) {
      logStep("ERROR: Failed to update form submission", { 
        submissionId: submission.id,
        error: updateError 
      });
      throw updateError;
    }

    logStep("Successfully updated form submission", { 
      submissionId: submission.id,
      paymentStatus 
    });

    // Send donation receipt email if payment was successful
    if (paymentStatus === "success") {
      logStep("Payment successful, sending donation receipt email", {
        email: submission.email,
        amount: amountInCents
      });
      
      sendDonationReceiptEmail(
        submission.full_name,
        submission.email,
        {
          amountCents: amountInCents,
          cansQuantity: submission.cans_quantity || 0,
          sponsorships: submission.sponsorships || [],
          donationDate: submission.created_at,
          transactionId: paymentIntentId || session_id,
        }
      ).catch(err => {
        logStep("ERROR: Donation email failed but continuing", { error: err });
      });
    }

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
    logStep("ERROR: Payment verification failed", { 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
