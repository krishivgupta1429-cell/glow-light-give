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
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

interface FormSubmission {
  id: string;
  full_name: string;
  email: string;
  area_code?: string | null;
  phone_number?: string | null;
  full_phone?: string | null;
  number_of_adults: number;
  number_of_children: number;
  drive_in_parade?: string | null;
  car_menorah_preference?: string | null;
  email_updates_opt_in?: boolean;
  sponsorships?: string[];
  created_at: string;
  payment_amount_cents?: number;
  payment_status?: string;
  stripe_payment_intent_id?: string | null;
  wants_to_donate?: boolean;
}

/**
 * Determines if user signed up for the parade
 */
function isParadeSignup(submission: FormSubmission): boolean {
  const value = submission.drive_in_parade?.toLowerCase();
  return value === "yes" || value === "true";
}

/**
 * Formats cents to dollar string
 */
function formatAmount(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/**
 * Formats date to US-style datetime
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats the car menorah preference for display
 */
function formatCarMenorahPreference(value: string | null | undefined): string {
  if (!value) return "N/A";
  if (value === "own" || value.toLowerCase().includes("own")) {
    return "I will have my own car menorah";
  }
  if (value === "borrow" || value.toLowerCase().includes("borrow") || value.toLowerCase().includes("chabad")) {
    return "I will borrow from Chabad";
  }
  return value;
}

/**
 * Builds the HTML summary table for email
 */
function buildSummaryTable(submission: FormSubmission): string {
  const rows: Array<{ label: string; value: string }> = [];

  // Parse full_name into first/last if possible
  const nameParts = submission.full_name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  rows.push({ label: "Full Name - First Name", value: firstName });
  rows.push({ label: "Full Name - Last Name", value: lastName });
  rows.push({ label: "E-mail", value: submission.email });
  
  // Phone number
  const phone = submission.full_phone || 
    (submission.area_code && submission.phone_number 
      ? `${submission.area_code}${submission.phone_number}` 
      : submission.phone_number || "N/A");
  rows.push({ label: "Phone Number", value: phone });
  
  rows.push({ label: "Number of adults", value: String(submission.number_of_adults || 0) });
  rows.push({ label: "Number of children", value: String(submission.number_of_children || 0) });
  
  rows.push({ 
    label: "Would you like to drive your car in the Menorah parade?", 
    value: submission.drive_in_parade || "No" 
  });
  
  rows.push({ 
    label: "Do you have your own car menorah or will you borrow from Chabad?", 
    value: formatCarMenorahPreference(submission.car_menorah_preference)
  });
  
  rows.push({ 
    label: "Optin", 
    value: submission.email_updates_opt_in ? "Yes" : "No" 
  });
  
  rows.push({ 
    label: "Submission Date", 
    value: formatDateTime(submission.created_at) 
  });
  
  rows.push({ label: "Submission Id", value: submission.id });

  const tableRows = rows
    .map(
      (row) => `<tr>
    <td style="padding: 8px; border: 1px solid #ddd;"><strong>${row.label}</strong></td>
    <td style="padding: 8px; border: 1px solid #ddd;">${row.value}</td>
  </tr>`
    )
    .join("\n");

  return `<table style="border-collapse: collapse; width: 100%; max-width: 600px; font-family: Arial, sans-serif; font-size: 14px;">
  ${tableRows}
</table>`;
}

interface EmailContent {
  subject: string;
  htmlContent: string;
}

/**
 * Gets email content for DONORS (parade vs non-parade)
 */
function getDonorEmailContent(
  submission: FormSubmission,
  signedUpForParade: boolean,
  formattedAmount: string
): EmailContent {
  const summaryTable = buildSummaryTable(submission);
  const fullName = submission.full_name;

  if (signedUpForParade) {
    // 4.1 Signed up for Parade – with donation
    return {
      subject: "Thank you for signing up for the Menorah Parade!",
      htmlContent: `<p>Dear ${fullName},</p>
<p>Your registration has been received.</p>
${summaryTable}
<p>Please be sure to arrive at Yavneh Academy by 5pm so we can stage the parade. We anticipate a parade departure of 5:30 PM, followed by arrival at Borough Hall at 6 PM.</p>
<p>Your donation of ${formattedAmount} is greatly appreciated and will help us provide a meaningful Chanukah to Jews across Paramus.</p>
<p>See you next week!</p>
<p>Rabbi Levi and Mussi Marasow<br/>
Chabad of Paramus</p>`,
    };
  }

  // 4.3 Didn't sign up for parade – with donation
  return {
    subject: "Thank you for your Chanukah registration and donation!",
    htmlContent: `<p>Dear ${fullName},</p>
<p>Your registration has been received.</p>
${summaryTable}
<p>Thank you for your generous donation of ${formattedAmount} which will help spread the light of Chanukah across Paramus. We look forward to seeing you at 1 Jockish Sq on December 14 at 6 PM.</p>
<p>Happy Chanukah!</p>
<p>Rabbi Levi and Mussi Marasow<br/>
Chabad of Paramus</p>`,
  };
}

/**
 * Sends confirmation email for DONORS via Brevo
 */
async function sendDonorConfirmationEmail(
  submission: FormSubmission,
  amountCents: number
): Promise<void> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    throw new Error("Missing BREVO_API_KEY");
  }

  const signedUpForParade = isParadeSignup(submission);
  const formattedAmount = formatAmount(amountCents);
  const { subject, htmlContent } = getDonorEmailContent(submission, signedUpForParade, formattedAmount);

  // Parse name for the "to" field
  const nameParts = submission.full_name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const toName = lastName ? `${firstName} ${lastName}` : firstName;

  const payload = {
    sender: { name: "Chabad of Paramus", email: "levi@chabadparamus.org" },
    to: [{ email: submission.email, name: toName }],
    bcc: [
      { email: "lmarasow@gmail.com" },
      { email: "mussigbaum@gmail.com" }
    ],
    subject,
    htmlContent,
  };

  logStep(`Sending ${signedUpForParade ? "parade" : "non-parade"} donor email to ${submission.email}`);

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

  logStep(`Successfully sent donor email to ${submission.email}`);
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

    // Find the form submission by checkout session ID - fetch all fields needed for email
    const { data: submission, error: findError } = await supabaseAdmin
      .from("form_submissions")
      .select("id, full_name, email, area_code, phone_number, full_phone, number_of_adults, number_of_children, drive_in_parade, car_menorah_preference, email_updates_opt_in, sponsorships, created_at, wants_to_donate, payment_status")
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

    // Send donor confirmation email if payment was successful
    if (paymentStatus === "success") {
      logStep("Payment successful, sending donor confirmation email", {
        email: submission.email,
        amount: amountInCents
      });
      
      const submissionForEmail: FormSubmission = {
        ...submission,
        payment_amount_cents: amountInCents,
        payment_status: paymentStatus,
        stripe_payment_intent_id: paymentIntentId,
      };

      sendDonorConfirmationEmail(submissionForEmail, amountInCents).catch(err => {
        logStep("ERROR: Donor confirmation email failed but continuing", { error: String(err) });
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
      JSON.stringify({ error: "An error occurred while verifying your payment. Please try again." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
