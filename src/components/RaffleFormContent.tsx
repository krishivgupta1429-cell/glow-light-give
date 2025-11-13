import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaymentHandler } from "./PaymentHandler";
import { PaymentCardSection } from "./PaymentCardSection";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  fullName: string;
  email: string;
  areaCode: string;
  phoneNumber: string;
  reason: string;
  otherReason: string;
  sponsorships: string[];
  cansQuantity: string;
  comments: string;
  emailUpdatesOptIn: boolean;
}

interface RaffleFormContentProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  emailError: string;
  areaCodeError: string;
  phoneNumberError: string;
  handleEmailChange: (email: string) => void;
  handleAreaCodeChange: (value: string) => void;
  handlePhoneNumberChange: (value: string) => void;
  handleSponsorshipChange: (id: string, checked: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  setEmailError: (error: string) => void;
  setAreaCodeError: (error: string) => void;
  setPhoneNumberError: (error: string) => void;
  sponsorshipOptions: Array<{ id: string; label: string; amount: number }>;
  canOptions: Array<{ quantity: number; label: string; amount: number }>;
  currentPhoneFormat: { placeholder: string; digits: number };
  sponsorshipTotal: number;
  totalAmount: number;
  isDonor: boolean;
  cansQuantity: number;
  clientSecret: string;
  paymentIntentId: string;
  submissionId: string;
  isLoadingPayment: boolean;
}

export const RaffleFormContent = (props: RaffleFormContentProps) => {
  const { confirmPayment, isReady } = usePaymentHandler();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const {
      formData,
      setIsSubmitting,
      isDonor,
      totalAmount,
      clientSecret,
      paymentIntentId,
      submissionId,
      sponsorshipTotal,
      cansQuantity,
      currentPhoneFormat,
      emailError: emailErr,
      areaCodeError: areaErr,
      phoneNumberError: phoneErr,
    } = props;

    // Validation
    if (emailErr) {
      toast.error("Invalid Email", { description: emailErr });
      return;
    }

    if (!formData.areaCode.startsWith('+') || formData.areaCode.length < 2) {
      props.setAreaCodeError("Area code must start with + and contain digits");
      toast.error("Invalid Area Code", {
        description: "Please enter a valid area code (e.g., +1, +91)",
      });
      return;
    }

    if (formData.phoneNumber.length < 6 || formData.phoneNumber.length > currentPhoneFormat.digits) {
      props.setPhoneNumberError(`Please enter a valid phone number for this area code (${currentPhoneFormat.digits} digits)`);
      toast.error("Invalid Phone Number", {
        description: `Please enter a valid phone number for this area code`,
      });
      return;
    }

    if (formData.reason === "other" && !formData.otherReason.trim()) {
      toast.error("Please tell us why you enjoy this event", {
        description: "The 'Other' option requires a response.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // DONOR PATH: Process payment first
      if (isDonor) {
        if (!isReady || !clientSecret) {
          toast.error("Payment Error", {
            description: "Payment system not ready. Please wait a moment and try again.",
          });
          setIsSubmitting(false);
          return;
        }

        // Confirm payment using the hook
        const paymentSuccess = await confirmPayment({
          clientSecret,
          formData: {
            fullName: formData.fullName,
            email: formData.email,
            areaCode: formData.areaCode,
            phoneNumber: formData.phoneNumber,
            sponsorships: formData.sponsorships,
          },
          onSuccess: async (paymentIntId) => {
            // Save submission to database
            const { data: saveData, error: saveError } = await supabase.functions.invoke(
              'save-donation-submission',
              {
                body: {
                  formData: {
                    ...formData,
                    enjoyReason: formData.reason,
                    otherEnjoyReason: formData.otherReason,
                    wantsEmailUpdates: formData.emailUpdatesOptIn,
                    sponsorships: formData.sponsorships.length,
                    totalAmount: totalAmount * 100, // Convert to cents
                    cansQuantity,
                  },
                  submissionId,
                  paymentIntentId: paymentIntId,
                  isDonor: true,
                },
              }
            );

            if (saveError || !saveData) {
              toast.error("Submission Error", {
                description: "Payment succeeded but failed to save your entry. Please contact support.",
              });
              setIsSubmitting(false);
              return;
            }

            toast.success("Success! ✨", {
              description: "Thank you for your generous donation!",
            });
            
            // Reset form
            props.setFormData({
              fullName: "",
              email: "",
              areaCode: "+1",
              phoneNumber: "",
              reason: "",
              otherReason: "",
              sponsorships: [],
              cansQuantity: "",
              comments: "",
              emailUpdatesOptIn: false,
            });
            props.setEmailError("");
            props.setAreaCodeError("");
            props.setPhoneNumberError("");
          },
          onError: (error) => {
            toast.error("Payment Failed", {
              description: error,
            });
            setIsSubmitting(false);
          },
        });

        if (!paymentSuccess) {
          setIsSubmitting(false);
          return;
        }
      } else {
        // NON-DONOR PATH: Just submit the form
        const { data: saveData, error: saveError } = await supabase.functions.invoke(
          'save-donation-submission',
          {
            body: {
              formData: {
                ...formData,
                enjoyReason: formData.reason,
                otherEnjoyReason: formData.otherReason,
                wantsEmailUpdates: formData.emailUpdatesOptIn,
                sponsorships: 0,
                totalAmount: 0,
                cansQuantity: 0,
              },
              isDonor: false,
            },
          }
        );

        if (saveError || !saveData) {
          toast.error("Submission Error", {
            description: "Failed to submit your entry. Please try again.",
          });
          setIsSubmitting(false);
          return;
        }

        toast.success("Entry Submitted! ✨", {
          description: "Thank you for entering the raffle!",
        });

        // Reset form
        props.setFormData({
          fullName: "",
          email: "",
          areaCode: "+1",
          phoneNumber: "",
          reason: "",
          otherReason: "",
          sponsorships: [],
          cansQuantity: "",
          comments: "",
          emailUpdatesOptIn: false,
        });
        props.setEmailError("");
        props.setAreaCodeError("");
        props.setPhoneNumberError("");
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { formData, isDonor, totalAmount, clientSecret, isLoadingPayment } = props;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Form content will go here - I'll add this in the next update */}
      {isDonor && totalAmount > 0 && clientSecret && (
        <PaymentCardSection 
          totalAmount={totalAmount} 
          isLoading={isLoadingPayment}
        />
      )}
      
      <Button
        type="submit"
        disabled={props.isSubmitting || (isDonor && (!clientSecret || isLoadingPayment))}
        className="w-full"
      >
        {props.isSubmitting ? "Processing..." : isDonor ? "Pay & Submit" : "Submit Entry"}
      </Button>
    </form>
  );
};
