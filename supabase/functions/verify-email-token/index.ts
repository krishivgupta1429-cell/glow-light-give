import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      throw new Error("Verification token is required");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the submission with this token
    const { data: submission, error: findError } = await supabase
      .from("form_submissions")
      .select("id, email, email_verified, verification_sent_at")
      .eq("verification_token", token)
      .single();

    if (findError || !submission) {
      console.error("Token not found:", findError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid or expired verification token" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if already verified
    if (submission.email_verified) {
      return new Response(
        JSON.stringify({ 
          success: true,
          alreadyVerified: true,
          message: "Email already verified" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if token is expired (24 hours)
    const sentAt = new Date(submission.verification_sent_at);
    const now = new Date();
    const hoursSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSent > 24) {
      return new Response(
        JSON.stringify({ 
          success: false,
          expired: true,
          error: "Verification token has expired. Please request a new one." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update the submission to mark as verified
    const { error: updateError } = await supabase
      .from("form_submissions")
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_token: null, // Clear the token
      })
      .eq("id", submission.id);

    if (updateError) {
      console.error("Error updating submission:", updateError);
      throw new Error("Failed to verify email");
    }

    console.log("Email verified successfully for:", submission.email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email verified successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-email-token function:", error);
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
