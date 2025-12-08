import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets when function cold starts)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// Zod schema for input validation
const submitEntrySchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long").toLowerCase(),
  area_code: z.string().max(10).nullable().optional(),
  phone_number: z.string().max(20).nullable().optional(),
  full_phone: z.string().max(30).nullable().optional(),
  number_of_adults: z.number().int().nonnegative().max(100, "Invalid number of adults"),
  number_of_children: z.number().int().nonnegative().max(100).optional().default(0),
  reason: z.string().min(1, "Reason is required").max(100),
  reason_other: z.string().max(500).nullable().optional(),
  drive_in_parade: z.string().max(50).nullable().optional(),
  car_menorah_preference: z.string().max(100).nullable().optional(),
  sponsorships: z.array(z.string().max(100)).max(10).default([]),
  email_updates_opt_in: z.boolean().optional().default(false),
  wants_to_donate: z.boolean().optional().default(false),
  verification_token: z.string().length(64, "Invalid verification token"),
  verification_sent_at: z.string().datetime(),
});

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
}

/**
 * Determines if user signed up for the parade
 */
function isParadeSignup(submission: FormSubmission): boolean {
  const value = submission.drive_in_parade?.toLowerCase();
  return value === "yes" || value === "true";
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
 * Gets email content for NON-DONORS (parade vs non-parade)
 */
function getNonDonorEmailContent(
  submission: FormSubmission,
  signedUpForParade: boolean
): EmailContent {
  const summaryTable = buildSummaryTable(submission);
  const fullName = submission.full_name;

  if (signedUpForParade) {
    // 4.2 Signed up for Parade – without donation
    return {
      subject: "Thank you for signing up for the Menorah Parade!",
      htmlContent: `<p>Dear ${fullName},</p>
<p>Your registration has been received.</p>
${summaryTable}
<p>Please be sure to arrive at Yavneh Academy by 5pm so we can stage the parade. We anticipate a parade departure of 5:30 PM, followed by arrival at Borough Hall at 6 PM.</p>
<p>See you next week!</p>
<p>Rabbi Levi and Mussi Marasow<br/>
Chabad of Paramus</p>`,
    };
  }

  // 4.4 Didn't sign up for parade – without donation
  return {
    subject: "Thank you for registering for the Menorah lighting!",
    htmlContent: `<p>Dear ${fullName},</p>
<p>Your registration has been received.</p>
${summaryTable}
<p>Thanks for signing up for the Menorah lighting on December 14 at Borough Hall, 1 Jockish Sq. We look forward to seeing you!</p>
<p>Rabbi Levi and Mussi Marasow<br/>
Chabad of Paramus</p>`,
  };
}

/**
 * Sends confirmation email for NON-DONORS via Brevo
 */
async function sendNonDonorConfirmationEmail(submission: FormSubmission): Promise<void> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    throw new Error("Missing BREVO_API_KEY");
  }

  const signedUpForParade = isParadeSignup(submission);
  const { subject, htmlContent } = getNonDonorEmailContent(submission, signedUpForParade);

  // Parse name for the "to" field
  const nameParts = submission.full_name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const toName = lastName ? `${firstName} ${lastName}` : firstName;

  const payload = {
    sender: { name: "Chabad of Paramus", email: "rabbi@chabadparamus.org" },
    to: [{ email: submission.email, name: toName }],
    // No BCC
    subject,
    htmlContent,
  };

  console.log(`[email] Sending ${signedUpForParade ? "parade" : "non-parade"} non-donor email to ${submission.email}`);

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

  console.log(`[email] Successfully sent to ${submission.email}`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (!checkRateLimit(clientIp)) {
      console.log(`[submit-form-entry] Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const rawBody = await req.json();

    // Validate input with zod schema
    const parseResult = submitEntrySchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.log("[submit-form-entry] Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0]?.message || "Invalid input" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const body = parseResult.data;

    // Compute full_phone if not provided but parts are
    let full_phone = body.full_phone ?? null;
    if (!full_phone && body.area_code && body.phone_number) {
      full_phone = `${body.area_code}${body.phone_number}`;
    }

    // Prepare insert payload
    const insertPayload = {
      full_name: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      area_code: body.area_code?.trim() ?? null,
      phone_number: body.phone_number?.trim() ?? null,
      full_phone,
      number_of_adults: body.number_of_adults,
      number_of_children: body.number_of_children ?? 0,
      reason: body.reason,
      reason_other: body.reason_other?.trim() ?? null,
      drive_in_parade: body.drive_in_parade?.trim() ?? null,
      car_menorah_preference: body.car_menorah_preference?.trim() ?? null,
      sponsorships: body.sponsorships ?? [],
      email_updates_opt_in: body.email_updates_opt_in ?? false,
      wants_to_donate: body.wants_to_donate ?? false,
      verification_token: body.verification_token,
      verification_sent_at: body.verification_sent_at,
      payment_status: body.wants_to_donate ? "pending" : "none",
    };

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .insert(insertPayload)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[submit-form-entry] Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Insert failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Send registration confirmation email only for NON-donors
    // Donors will receive their email after payment success
    if (!body.wants_to_donate) {
      const submissionForEmail: FormSubmission = {
        id: data.id,
        full_name: insertPayload.full_name,
        email: insertPayload.email,
        area_code: insertPayload.area_code,
        phone_number: insertPayload.phone_number,
        full_phone: insertPayload.full_phone,
        number_of_adults: insertPayload.number_of_adults,
        number_of_children: insertPayload.number_of_children,
        drive_in_parade: insertPayload.drive_in_parade,
        car_menorah_preference: insertPayload.car_menorah_preference,
        email_updates_opt_in: insertPayload.email_updates_opt_in,
        sponsorships: insertPayload.sponsorships,
        created_at: data.created_at,
        payment_status: "none",
      };

      sendNonDonorConfirmationEmail(submissionForEmail).catch(err => {
        console.error("[submit-form-entry] Email sending failed but continuing:", err);
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("[submit-form-entry] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
