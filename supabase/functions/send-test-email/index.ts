import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const testEmail = "rabbi@jewishtc.org";
    const fullName = "Test User";

    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) {
      throw new Error("Missing BREVO_API_KEY");
    }

    const htmlContent = `Hi ${fullName},<br/><br/>
      Thank you so much for signing up for Menorah in the Square—we can't wait to celebrate with you!<br/><br/>
      📍 <strong>Location:</strong> Rotary Square<br/>
      203 S Union St, Traverse City, MI 49684<br/>
      🕔 <strong>Event Start Time:</strong> 5:00 PM<br/>
      📅 <strong>Date:</strong> December 21st<br/><br/>
      Your participation helps bring warmth and light to our whole community.<br/><br/>
      To help spread the light even further, would you consider forwarding the event sign-up to five friends?<br/><br/>
      Here's the link: <a href="https://menorah.jewishtc.org/">https://menorah.jewishtc.org/</a><br/><br/>
      If you have any questions at all, feel free to reach out anytime.<br/>
      Looking forward to celebrating together!<br/><br/>
      Warmly,<br/>
      Rabbi Laibel & Chaya Shemtov<br/>
      Chabad Jewish Center of Traverse City<br/>
      <a href="https://JewishTC.org">JewishTC.org</a><br/><br/>
      <strong>P.S.</strong> Congratulations on being among the first 100 sign-ups!<br/>
      Please show this email when you arrive to receive your free beanie.<br/>
      Be sure to show it before 5:05 PM—after that time, we'll begin giving them out to everyone.<br/><br/>
      <strong>P.S.s</strong><br/>
      View the lamplighter wall:<br/>
      <a href="https://www.jewishtc.org/templates/articlecco_cdo/aid/7109138/jewish/Untitled.htm">https://www.jewishtc.org/templates/articlecco_cdo/aid/7109138/jewish/Untitled.htm</a>`;

    const payload = {
      sender: { name: "Rabbi Laibel Shemtov", email: "rabbi@jewishtc.org" },
      to: [{ email: testEmail, name: fullName }],
      bcc: [{ email: "laibelswb@gmail.com", name: "Rabbi Laibel" }],
      subject: "You're Registered for Menorah in the Square!",
      htmlContent,
    };

    console.log("[email] Attempting to send test email...");

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
    
    console.log(`[email] Sent successfully to ${testEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error(`[email] Error: ${err}`);
    return new Response(JSON.stringify({ error: "Email sending failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
