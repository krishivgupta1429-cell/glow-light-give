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
    const testEmail = "laibelswb@gmail.com";
    const fullName = "Test User";
    const firstName = fullName?.split(" ")[0] || fullName;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${firstName},</p>
        <p>This is a test email from the Menorah in the Square registration system to verify SMTP delivery.</p>
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

    await client.send({
      from: "Rabbi Laibel Shemtov <laibelswb@gmail.com>",
      to: testEmail,
      replyTo: "laibelswb@gmail.com",
      subject: "Test Email - Menorah in the Square",
      content: `Hi ${firstName}, this is a test email from Menorah in the Square.`,
      html: htmlBody,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Email sending failed:", err);
    return new Response(JSON.stringify({ error: "Email sending failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
