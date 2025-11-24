import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
    const firstName = fullName?.split(" ")[0] || fullName;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${firstName},</p>
        
        <p>This is a test email from the Menorah in the Square registration system to verify Brevo SMTP delivery.</p>
        
        <p>If you're receiving this, your SMTP configuration is working correctly!</p>
        
        <p>Warmly,<br/>
        Rabbi Laibel & Chaya Shemtov<br/>
        Chabad Jewish Center of Traverse City<br/>
        <a href="https://JewishTC.org">JewishTC.org</a></p>
      </div>
    `;

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

    console.log("[email] Attempting to send test email...");

    await client.send({
      from: "rabbi@jewishtc.org",
      to: testEmail,
      replyTo: "rabbi@jewishtc.org",
      subject: "Test Email - Menorah in the Square",
      content: `Hi ${firstName}, this is a test email from Menorah in the Square registration system to verify Brevo SMTP delivery.`,
      html: htmlBody,
    });

    await client.close();
    
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
