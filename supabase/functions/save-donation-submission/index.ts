import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { formData, submissionId, paymentIntentId, isDonor } = await req.json();

    console.log('[SAVE-DONATION-SUBMISSION] Request received', { submissionId, isDonor });

    // Generate full phone in E.164 format
    const fullPhone = formData.areaCode && formData.phoneNumber 
      ? `${formData.areaCode}${formData.phoneNumber}` 
      : null;

    // Save form submission
    const { data: submission, error: submissionError } = await supabaseClient
      .from('form_submissions')
      .insert({
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        area_code: formData.areaCode?.trim() || null,
        phone_number: formData.phoneNumber?.trim() || null,
        phone: fullPhone,
        reason: formData.enjoyReason,
        reason_other: formData.otherEnjoyReason?.trim() || null,
        sponsorships: formData.sponsorships,
        comments: formData.comments?.trim() || null,
        email_updates_opt_in: formData.wantsEmailUpdates || false,
        cans_quantity: formData.cansQuantity || 0,
        email_verified: false,
        is_donor: isDonor,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('[SAVE-DONATION-SUBMISSION] Error saving submission:', submissionError);
      throw submissionError;
    }

    console.log('[SAVE-DONATION-SUBMISSION] Submission saved', { id: submission.id });

    // If this is a donor, create donation record
    if (isDonor && formData.sponsorshipLevel) {
      const { error: donationError } = await supabaseClient
        .from('donations')
        .insert({
          form_submission_id: submission.id,
          amount_cents: formData.totalAmount,
          cans_amount_cents: formData.cansAmount || 0,
          sponsorship_level: formData.sponsorshipLevel,
          stripe_payment_intent_id: paymentIntentId,
          status: 'succeeded', // Payment already succeeded at this point
        });

      if (donationError) {
        console.error('[SAVE-DONATION-SUBMISSION] Error saving donation:', donationError);
        throw donationError;
      }

      console.log('[SAVE-DONATION-SUBMISSION] Donation saved');
    }

    return new Response(
      JSON.stringify({ success: true, submissionId: submission.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[SAVE-DONATION-SUBMISSION] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});