import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  name: string;
  token: string;
}

// Input validation
const RequestSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  token: z.string().min(32).max(64),
});

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const key = `email:${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting - 3 emails per minute per IP
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip, 3, 60)) {
    console.warn('[SEND-VERIFICATION-EMAIL] Rate limit exceeded', { ip });
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Too many requests. Please try again later.' 
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const rawData: VerificationEmailRequest = await req.json();

    // Validate input
    const { email, name, token } = RequestSchema.parse(rawData);

    const verificationUrl = `${req.headers.get("origin") || "https://light-the-way-glow.lovable.app"}/verify-email?token=${token}`;

    // Log minimal information (token ID only, not the full URL)
    console.log("Verification email requested for:", email);
    console.log("Token ID (first 8 chars):", token.substring(0, 8) + "...");
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

    // Only return verification URL in development environment
    const isDevelopment = Deno.env.get("ENVIRONMENT") === "development";
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Verification email sent successfully",
        // Include verification URL only in development for testing
        ...(isDevelopment && { verificationUrl }),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-verification-email function:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
