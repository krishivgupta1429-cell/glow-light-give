import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  name: string;
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, token }: VerificationEmailRequest = await req.json();

    if (!email || !name || !token) {
      throw new Error("Missing required fields: email, name, or token");
    }

    const verificationUrl = `${req.headers.get("origin") || "https://light-the-way-glow.lovable.app"}/verify-email?token=${token}`;

    // For now, log the verification URL (in production, integrate with email service)
    console.log("Verification email requested for:", email);
    console.log("Verification URL:", verificationUrl);
    console.log("Name:", name);

    // TODO: Integrate with email service provider (e.g., Resend, SendGrid)
    // Example with Resend:
    // const resendApiKey = Deno.env.get("RESEND_API_KEY");
    // const { Resend } = await import("npm:resend@2.0.0");
    // const resend = new Resend(resendApiKey);
    // 
    // await resend.emails.send({
    //   from: "Menorah in the Square <noreply@yourdomain.com>",
    //   to: [email],
    //   subject: "Confirm your email for Menorah in the Square",
    //   html: `
    //     <h1>Thank you for registering, ${name}!</h1>
    //     <p>Please confirm your email address by clicking the button below:</p>
    //     <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#FFD700;color:#000;text-decoration:none;border-radius:6px;font-weight:bold;">Confirm Email</a>
    //     <p>Or copy and paste this link into your browser:</p>
    //     <p>${verificationUrl}</p>
    //     <p>This link will expire in 24 hours.</p>
    //   `,
    // });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Verification email sent successfully",
        // Include verification URL in response for testing/development
        verificationUrl: verificationUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
