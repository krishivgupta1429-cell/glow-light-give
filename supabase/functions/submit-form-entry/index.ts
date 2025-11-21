import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitEntryBody {
  full_name: string;
  email: string;
  area_code?: string | null;
  phone_number?: string | null;
  full_phone?: string | null;
  number_of_adults: number;
  number_of_children?: number;
  reason: string;
  reason_other?: string | null;
  sponsorships: string[];
  cans_quantity: number;
  comments?: string | null;
  email_updates_opt_in?: boolean;
  wants_to_donate?: boolean;
  verification_token: string;
  verification_sent_at: string;
}

async function sendRegistrationEmail(fullName: string, email: string): Promise<void> {
  try {
    console.log(`[submit-form-entry] Attempting to send registration email to ${email}`);
    console.log(`[submit-form-entry] SMTP Config: host=${Deno.env.get("SMTP_HOST")}, port=${Deno.env.get("SMTP_PORT")}, username=${Deno.env.get("SMTP_USERNAME")}`);
    
    const firstName = fullName.split(' ')[0] || fullName;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${firstName},</p>
        
        <p>Thank you so much for signing up for Menorah in the Square—we can't wait to celebrate with you!</p>
        
        <p>📍 <b>Location:</b> Rotary Square<br/>
        203 S Union St, Traverse City, MI 49684<br/>
        🕔 <b>Event Start Time:</b> 5:00 PM<br/>
        📅 <b>Date:</b> December 21st</p>
        
        <p>Your participation helps bring warmth and light to our whole community.</p>
        
        <p>To help spread the light even further, would you consider forwarding the event sign-up to five friends?</p>
        
        <p>Here's the link: <a href="https://menorah.jewishtc.org/">https://menorah.jewishtc.org/</a></p>
        
        <p>If you have any questions at all, feel free to reach out anytime.<br/>
        Looking forward to celebrating together!</p>
        
        <p>Warmly,<br/>
        Rabbi Laibel & Chaya Shemtov<br/>
        Chabad Jewish Center of Traverse City<br/>
        <a href="https://JewishTC.org">JewishTC.org</a></p>
        
        <p><b>P.S.</b> Congratulations on being among the first 100 sign-ups!<br/>
        Please show this email when you arrive to receive your free beanie.<br/>
        Be sure to show it before 5:05 PM—after that time, we'll begin giving them out to everyone.</p>
      </div>
    `;
    
    const textBody = `Hi ${firstName},

Thank you so much for signing up for Menorah in the Square—we can't wait to celebrate with you!

Location: Rotary Square
203 S Union St, Traverse City, MI 49684
Event Start Time: 5:00 PM
Date: December 21st

Your participation helps bring warmth and light to our whole community.

To help spread the light even further, would you consider forwarding the event sign-up to five friends?

Here's the link: https://menorah.jewishtc.org/

If you have any questions at all, feel free to reach out anytime.
Looking forward to celebrating together!

Warmly,
Rabbi Laibel & Chaya Shemtov
Chabad Jewish Center of Traverse City
JewishTC.org

P.S. Congratulations on being among the first 100 sign-ups!
Please show this email when you arrive to receive your free beanie.
Be sure to show it before 5:05 PM—after that time, we'll begin giving them out to everyone.`;

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST") ?? "",
        port: Number(Deno.env.get("SMTP_PORT")) || 587,
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USERNAME") ?? "",
          password: Deno.env.get("SMTP_PASSWORD") ?? "",
        },
      },
    });

    console.log(`[submit-form-entry] SMTP client configured, sending email...`);

    await client.send({
      from: "Rabbi Laibel Shemtov <laibelswb@gmail.com>",
      to: email,
      replyTo: "laibelswb@gmail.com",
      subject: "You're Registered for Menorah in the Square!",
      content: textBody,
      html: htmlBody,
    });

    await client.close();
    console.log(`[submit-form-entry] Registration email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[submit-form-entry] Failed to send registration email to ${email}:`, error);
    // Don't throw - we don't want email failures to block form submission
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = (await req.json()) as Partial<SubmitEntryBody>;

    // Minimal validation of required fields
    if (!body.full_name || !body.email || !body.reason || !body.verification_token || !body.verification_sent_at || body.number_of_adults === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

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
      sponsorships: body.sponsorships ?? [],
      cans_quantity: body.cans_quantity ?? 0,
      comments: body.comments?.trim() ?? null,
      email_updates_opt_in: body.email_updates_opt_in ?? false,
      wants_to_donate: body.wants_to_donate ?? false,
      verification_token: body.verification_token,
      verification_sent_at: body.verification_sent_at,
      payment_status: body.wants_to_donate ? "pending" : "none",
    };

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("[submit-form-entry] Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Insert failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Send registration confirmation email (non-blocking)
    sendRegistrationEmail(body.full_name, body.email).catch(err => {
      console.error("[submit-form-entry] Email sending failed but continuing:", err);
    });

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
