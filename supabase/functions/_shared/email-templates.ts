// Shared email utilities for Chabad of Paramus

export interface FormSubmission {
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
export function isParadeSignup(submission: FormSubmission): boolean {
  const value = submission.drive_in_parade?.toLowerCase();
  return value === "yes" || value === "true";
}

/**
 * Determines if user is a donor (payment succeeded)
 */
export function isDonor(submission: FormSubmission): boolean {
  return !!(
    submission.payment_amount_cents &&
    Number(submission.payment_amount_cents) > 0 &&
    submission.payment_status === "success"
  );
}

/**
 * Formats cents to dollar string
 */
export function formatAmount(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/**
 * Formats date to US-style datetime
 */
export function formatDateTime(dateString: string): string {
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
export function buildSummaryTable(submission: FormSubmission): string {
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
 * Gets the appropriate email content based on parade signup and donation status
 */
export function getEmailContent(
  submission: FormSubmission,
  signedUpForParade: boolean,
  hasDonated: boolean,
  formattedAmount?: string,
  reference?: string
): EmailContent {
  const summaryTable = buildSummaryTable(submission);
  const fullName = submission.full_name;

  if (signedUpForParade && hasDonated) {
    // 4.1 Signed up for Parade – with donation
    return {
      subject: "Thank you for signing up for the Menorah Parade!",
      htmlContent: `<p>Dear ${fullName},</p>
<p>Your registration has been received.</p>
${summaryTable}
<p>Please be sure to arrive at Yavneh Academy by 5pm so we can stage the parade. We anticipate a parade departure of 5:30 PM, followed by arrival at Borough Hall at 6 PM.</p>
<p>Your donation of ${formattedAmount} is greatly appreciated and will help us provide a meaningful Chanukah to Jews across Paramus.</p>
<p>See you next week!</p>
<p>Rabbi Levi and Mussi Marasow<br/>
Chabad of Paramus</p>`,
    };
  }

  if (signedUpForParade && !hasDonated) {
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

  if (!signedUpForParade && hasDonated) {
    // 4.3 Didn't sign up for parade – with donation
    return {
      subject: "Thank you for your Chanukah registration and donation!",
      htmlContent: `<p>Dear ${fullName},</p>
<p>Your registration has been received.</p>
${summaryTable}
<p>Thank you for your generous donation of ${formattedAmount} which will help spread the light of Chanukah across Paramus. We look forward to seeing you at 1 Jockish Sq on December 14 at 6 PM.</p>
<p>Happy Chanukah!</p>
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
 * Sends the appropriate confirmation email via Brevo
 */
export async function sendConfirmationEmail(
  submission: FormSubmission
): Promise<void> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    throw new Error("Missing BREVO_API_KEY");
  }

  const signedUpForParade = isParadeSignup(submission);
  const hasDonated = isDonor(submission);
  
  const formattedAmount = hasDonated && submission.payment_amount_cents 
    ? formatAmount(submission.payment_amount_cents) 
    : undefined;
  
  const reference = submission.stripe_payment_intent_id || submission.id;

  const { subject, htmlContent } = getEmailContent(
    submission,
    signedUpForParade,
    hasDonated,
    formattedAmount,
    reference
  );

  // Parse name for the "to" field
  const nameParts = submission.full_name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const toName = lastName ? `${firstName} ${lastName}` : firstName;

  const payload = {
    sender: { name: "Chabad of Paramus", email: "levi@chabadparamus.org" },
    to: [{ email: submission.email, name: toName }],
    bcc: [
      { email: "lmarasow@gmail.com" },
      { email: "mussigbaum@gmail.com" }
    ],
    subject,
    htmlContent,
  };

  console.log(`[email] Sending ${signedUpForParade ? "parade" : "non-parade"} ${hasDonated ? "donor" : "non-donor"} email to ${submission.email}`);

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
