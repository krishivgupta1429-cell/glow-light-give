import { supabase } from "@/integrations/supabase/client";

export interface MenorahEntryData {
  fullName: string;
  email: string;
  phone: string;
  enjoyReason: string;
  otherEnjoyReason?: string;
  sponsorships: string[];
  cansQuantity: string;
  comments?: string;
  emailUpdatesOptIn: boolean;
}

export interface MenorahEntryResponse {
  success: boolean;
  entryId?: string;
  error?: string;
}

/**
 * Submits a menorah entry to the Lovable Cloud database
 * @param formData - The form data from the RaffleForm component
 * @returns Promise with success status and entry ID or error message
 */
export async function submitEntry(
  formData: MenorahEntryData
): Promise<MenorahEntryResponse> {
  try {
    // Validation
    if (!formData.fullName || !formData.fullName.trim()) {
      return {
        success: false,
        error: "Full name is required",
      };
    }

    if (!formData.email || !formData.email.trim()) {
      return {
        success: false,
        error: "Email address is required",
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return {
        success: false,
        error: "Please enter a valid email address",
      };
    }

    if (!formData.enjoyReason) {
      return {
        success: false,
        error: "Please select a reason for enjoying this event",
      };
    }

    // Validate "other" reason if selected
    if (
      formData.enjoyReason === "other" &&
      (!formData.otherEnjoyReason || !formData.otherEnjoyReason.trim())
    ) {
      return {
        success: false,
        error: "Please tell us why you enjoy this event",
      };
    }

    // Calculate sponsorship amounts
    const sponsorshipOptions = [
      { id: "doughnut", label: "DOUGHNUT SPONSOR", amount: 36 },
      { id: "doughnut-gold", label: "DOUGHNUT GOLD SPONSOR", amount: 72 },
      { id: "doughnut-platinum", label: "DOUGHNUT PLATINUM SPONSOR", amount: 108 },
      { id: "menorah", label: "MENORAH SPONSOR", amount: 180 },
      { id: "menorah-gold", label: "MENORAH GOLD SPONSOR", amount: 360 },
      { id: "menorah-platinum", label: "MENORAH PLATINUM SPONSOR", amount: 540 },
    ];

    const sponsorshipAmountUsd = formData.sponsorships.reduce((total, sponsorshipId) => {
      const option = sponsorshipOptions.find((opt) => opt.id === sponsorshipId);
      return total + (option?.amount || 0);
    }, 0);

    // Get sponsorship level labels
    const sponsorshipLevel = formData.sponsorships
      .map((id) => sponsorshipOptions.find((opt) => opt.id === id)?.label)
      .filter(Boolean)
      .join(", ");

    // Calculate cans amount
    const canOptions = [
      { quantity: 1, label: "1 CAN – $4", amount: 4 },
      { quantity: 2, label: "2 CAN – $8", amount: 8 },
      { quantity: 4, label: "4 CANS – $16", amount: 16 },
      { quantity: 6, label: "6 CANS – $24", amount: 24 },
      { quantity: 8, label: "8 CANS – $32", amount: 32 },
      { quantity: 10, label: "10 CANS – $40", amount: 40 },
      { quantity: 15, label: "15 CANS – $60", amount: 60 },
      { quantity: 20, label: "20 CANS – $80", amount: 80 },
      { quantity: 30, label: "30 CANS – $120", amount: 120 },
      { quantity: 40, label: "40 CANS – $160", amount: 160 },
      { quantity: 50, label: "50 CANS – $200", amount: 200 },
      { quantity: 100, label: "100 CANS – $400", amount: 400 },
    ];

    const selectedCanOption = canOptions.find(
      (option) => option.label === formData.cansQuantity
    );
    const cansAmountUsd = selectedCanOption?.amount || 0;

    // Calculate total
    const totalAmountUsd = sponsorshipAmountUsd + cansAmountUsd;

    // Determine lamplighter eligibility (donations > 0)
    const lamplighterEligible = totalAmountUsd > 0;

    // Prepare the database entry
    const entry = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      enjoy_reason: formData.enjoyReason,
      other_enjoy_reason: formData.otherEnjoyReason?.trim() || null,
      sponsorship_level: sponsorshipLevel || null,
      sponsorship_amount_usd: sponsorshipAmountUsd,
      cans_option: formData.cansQuantity || null,
      cans_amount_usd: cansAmountUsd,
      total_amount_usd: totalAmountUsd,
      comments: formData.comments?.trim() || null,
      wants_email_updates: formData.emailUpdatesOptIn,
      lamplighter_eligible: lamplighterEligible,
      raw_form_json: formData,
    };

    // Insert into database
    const { data, error } = await supabase
      .from("menorah_entries")
      .insert(entry)
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting menorah entry:", error);
      return {
        success: false,
        error: "Failed to submit your entry. Please try again.",
      };
    }

    // Log success for testing
    console.log("Created menorah_entries row with id:", data.id);

    return {
      success: true,
      entryId: data.id,
    };
  } catch (error) {
    console.error("Unexpected error submitting entry:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
