import { useState, useEffect, FormEvent } from "react";
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
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from "sonner";
import { validateEmail } from "@/lib/emailValidation";
import { supabase } from "@/integrations/supabase/client";

interface RaffleFormContentProps {
  createPaymentIntent: (sponsorshipIds: string[], cansQuantity: number, formData: { fullName: string; email: string }) => Promise<void>;
  clientSecret: string;
  paymentIntentId: string;
  submissionId: string;
  isLoadingPayment: boolean;
}

export const RaffleFormContent = ({
  createPaymentIntent,
  clientSecret,
  paymentIntentId,
  submissionId,
  isLoadingPayment,
}: RaffleFormContentProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    areaCode: "+1",
    phoneNumber: "",
    reason: "",
    otherReason: "",
    sponsorships: [] as string[],
    cansQuantity: "",
    comments: "",
    emailUpdatesOptIn: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [areaCodeError, setAreaCodeError] = useState<string>("");
  const [phoneNumberError, setPhoneNumberError] = useState<string>("");

  const phoneFormats: Record<string, { placeholder: string; digits: number }> = {
    '+1': { placeholder: '123-456-7890', digits: 10 },
    '+44': { placeholder: '7123 456789', digits: 10 },
    '+91': { placeholder: '98765 43210', digits: 10 },
    '+61': { placeholder: '412 345 678', digits: 9 },
    '+971': { placeholder: '50 123 4567', digits: 9 },
    '+972': { placeholder: '50-123-4567', digits: 9 },
  };

  const currentPhoneFormat = phoneFormats[formData.areaCode] ?? { 
    placeholder: 'Phone number', 
    digits: 15 
  };

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
  const cansQuantity = selectedCanOption?.quantity || 0;

  const sponsorshipOptions = [
    { id: "doughnut", label: "DOUGHNUT SPONSOR", amount: 36 },
    { id: "doughnut-gold", label: "DOUGHNUT GOLD SPONSOR", amount: 72 },
    { id: "doughnut-platinum", label: "DOUGHNUT PLATINUM SPONSOR", amount: 108 },
    { id: "menorah", label: "MENORAH SPONSOR", amount: 180 },
    { id: "menorah-gold", label: "MENORAH GOLD SPONSOR", amount: 360 },
    { id: "menorah-platinum", label: "MENORAH PLATINUM SPONSOR", amount: 540 },
  ];

  const sponsorshipTotal = formData.sponsorships.reduce((total, sponsorshipId) => {
    const option = sponsorshipOptions.find((opt) => opt.id === sponsorshipId);
    return total + (option?.amount || 0);
  }, 0);

  const totalAmount = sponsorshipTotal;
  const isDonor = formData.sponsorships.length > 0;

  // Create payment intent when sponsorships or user info changes
  useEffect(() => {
    if (formData.sponsorships.length > 0 && formData.fullName && formData.email) {
      createPaymentIntent(formData.sponsorships, cansQuantity, {
        fullName: formData.fullName,
        email: formData.email,
      });
    }
  }, [formData.sponsorships, cansQuantity, formData.fullName, formData.email]);

  const handleSponsorshipChange = (sponsorshipId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        sponsorships: [...formData.sponsorships, sponsorshipId],
      });
    } else {
      setFormData({
        ...formData,
        sponsorships: formData.sponsorships.filter((id) => id !== sponsorshipId),
      });
    }
  };

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    
    if (email.trim()) {
      const validation = validateEmail(email);
      if (!validation.valid) {
        setEmailError(validation.error || "");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  };

  const handleAreaCodeChange = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+') || cleaned === '') {
      const areaCode = cleaned.slice(0, 4);
      setFormData({ ...formData, areaCode });
      
      if (areaCode && areaCode.length < 2) {
        setAreaCodeError("Area code must be at least 2 characters");
      } else if (areaCode && !areaCode.startsWith('+')) {
        setAreaCodeError("Area code must start with +");
      } else {
        setAreaCodeError("");
      }
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '').slice(0, currentPhoneFormat.digits);
    setFormData({ ...formData, phoneNumber });
    
    if (phoneNumber && phoneNumber.length < 6) {
      setPhoneNumberError("Phone number must be at least 6 digits");
    } else if (phoneNumber && phoneNumber.length > currentPhoneFormat.digits) {
      setPhoneNumberError(`Phone number must be at most ${currentPhoneFormat.digits} digits for this area code`);
    } else {
      setPhoneNumberError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || "Invalid email");
      toast.error("Invalid Email", { description: emailValidation.error });
      return;
    }

    if (!formData.areaCode.startsWith('+') || formData.areaCode.length < 2) {
      setAreaCodeError("Area code must start with + and contain digits");
      toast.error("Invalid Area Code", {
        description: "Please enter a valid area code (e.g., +1, +91)",
      });
      return;
    }

    if (formData.phoneNumber.length < 6 || formData.phoneNumber.length > currentPhoneFormat.digits) {
      setPhoneNumberError(`Please enter a valid phone number for this area code (${currentPhoneFormat.digits} digits)`);
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
      if (isDonor) {
        if (!stripe || !elements) {
          toast.error("Payment Error", {
            description: "Payment system not ready. Please wait a moment and try again.",
          });
          setIsSubmitting(false);
          return;
        }

        if (!clientSecret) {
          toast.error("Payment Error", {
            description: "Payment not initialized. Please wait a moment.",
          });
          setIsSubmitting(false);
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error("Payment Error", {
            description: "Please enter your card information.",
          });
          setIsSubmitting(false);
          return;
        }

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.fullName,
              email: formData.email,
              phone: `${formData.areaCode}${formData.phoneNumber}`,
            },
          },
        });
        
        const { error: confirmError, paymentIntent } = result;

        if (confirmError) {
          toast.error("Payment Failed", {
            description: confirmError.message || "Payment could not be processed.",
          });
          setIsSubmitting(false);
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
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
                  totalAmount: totalAmount * 100,
                  cansQuantity,
                },
                submissionId,
                paymentIntentId: paymentIntent.id,
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
            description: "Thank you for being part of our community celebration.",
          });
          
          setFormData({
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
          setEmailError("");
          setAreaCodeError("");
          setPhoneNumberError("");
        }
      } else {
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
          description: "Thank you for being part of our community celebration.",
        });

        setFormData({
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
        setEmailError("");
        setAreaCodeError("");
        setPhoneNumberError("");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-foreground font-medium text-base">
          Full Name <span className="text-gold">*</span>
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium text-base">
          Email Address <span className="text-gold">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          required
          className={`bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] ${
            emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500/40" : ""
          }`}
        />
        {emailError && (
          <p className="text-sm text-red-500 mt-1">{emailError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-medium text-base">
          Phone Number <span className="text-gold">*</span>
        </Label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-24 flex-shrink-0">
            <Label htmlFor="areaCode" className="text-xs text-foreground/70 mb-1 block">
              Area Code
            </Label>
            <Input
              id="areaCode"
              type="text"
              placeholder="+1"
              value={formData.areaCode}
              onChange={(e) => handleAreaCodeChange(e.target.value)}
              required
              maxLength={4}
              className={`bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] ${
                areaCodeError ? "border-red-500 focus:border-red-500 focus:ring-red-500/40" : ""
              }`}
            />
            {areaCodeError && (
              <p className="text-xs text-red-500 mt-1">{areaCodeError}</p>
            )}
          </div>
          <div className="flex-1">
            <Label htmlFor="phoneNumber" className="text-xs text-foreground/70 mb-1 block">
              Number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder={currentPhoneFormat.placeholder}
              value={formData.phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              required
              maxLength={currentPhoneFormat.digits}
              inputMode="numeric"
              pattern="\d*"
              className={`bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] ${
                phoneNumberError ? "border-red-500 focus:border-red-500 focus:ring-red-500/40" : ""
              }`}
            />
            {phoneNumberError && (
              <p className="text-xs text-red-500 mt-1">{phoneNumberError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-medium text-base">
          Why do you enjoy this event? <span className="text-gold">*</span>
        </Label>
        <RadioGroup
          value={formData.reason}
          onValueChange={(value) => setFormData({ ...formData, reason: value })}
          required
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent/10 transition-colors cursor-pointer">
            <RadioGroupItem value="community" id="community" />
            <Label htmlFor="community" className="text-foreground/90 cursor-pointer flex-1">
              Being part of the community
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent/10 transition-colors cursor-pointer">
            <RadioGroupItem value="tradition" id="tradition" />
            <Label htmlFor="tradition" className="text-foreground/90 cursor-pointer flex-1">
              The tradition
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent/10 transition-colors cursor-pointer">
            <RadioGroupItem value="food" id="food" />
            <Label htmlFor="food" className="text-foreground/90 cursor-pointer flex-1">
              The food!
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent/10 transition-colors cursor-pointer">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other" className="text-foreground/90 cursor-pointer flex-1">
              Other (please specify)
            </Label>
          </div>
        </RadioGroup>
        {formData.reason === "other" && (
          <Textarea
            placeholder="Please tell us what you enjoy about this event..."
            value={formData.otherReason}
            onChange={(e) => setFormData({ ...formData, otherReason: e.target.value })}
            className="mt-3 bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] min-h-[100px]"
          />
        )}
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>

      <div className="space-y-4">
        <Label className="text-foreground font-medium text-base block">
          Support Our Event (Optional)
        </Label>
        <p className="text-sm text-muted-foreground">
          Choose any sponsorship level(s) to support our community event.
        </p>
        <div className="space-y-3">
          {sponsorshipOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-3 p-4 rounded-lg border border-border/60 bg-background/40 backdrop-blur-sm hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all duration-300"
            >
              <Checkbox
                id={option.id}
                checked={formData.sponsorships.includes(option.id)}
                onCheckedChange={(checked) => handleSponsorshipChange(option.id, checked as boolean)}
                className="border-gold/60 data-[state=checked]:bg-gold data-[state=checked]:text-background"
              />
              <Label
                htmlFor={option.id}
                className="flex-1 text-foreground cursor-pointer flex items-center justify-between"
              >
                <span>{option.label}</span>
                <span className="text-gold font-semibold">${option.amount}</span>
              </Label>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gold/30">
          <span className="text-foreground font-semibold text-base md:text-lg">Total Charge</span>
          <span className="text-gold font-bold text-lg md:text-xl">
            ${sponsorshipTotal.toFixed(2)} USD
          </span>
        </div>
      </div>

      {totalAmount > 0 && (
        <div className="space-y-4 mt-6 p-6 rounded-lg border border-gold/30 bg-background/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-foreground">
              💳 Payment Details
            </Label>
            <span className="text-gold font-semibold">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          
          {isLoadingPayment ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading payment form...
            </div>
          ) : !stripe || !elements || !clientSecret ? (
            <div className="p-4 text-center text-muted-foreground">
              Initializing payment system...
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="card-element" className="text-foreground/90">
                Card Information <span className="text-gold">*</span>
              </Label>
              <div className="p-4 rounded-md border border-border/60 bg-input/80 backdrop-blur-sm hover:border-gold/60 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/40 transition-all duration-300">
                <CardElement
                  id="card-element"
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#ffffff',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        '::placeholder': {
                          color: 'rgba(255, 255, 255, 0.5)',
                        },
                        backgroundColor: 'transparent',
                      },
                      invalid: {
                        color: '#ef4444',
                        iconColor: '#ef4444',
                      },
                    },
                    hidePostalCode: false,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your payment is secured by Stripe. We never store your card details.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cansQuantity" className="text-foreground font-medium text-base">
          How many cans are you donating?
        </Label>
        <Select
          value={formData.cansQuantity}
          onValueChange={(value) => setFormData({ ...formData, cansQuantity: value })}
        >
          <SelectTrigger className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <SelectValue placeholder="Select quantity (optional)" />
          </SelectTrigger>
          <SelectContent>
            {canOptions.map((option) => (
              <SelectItem key={option.quantity} value={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments" className="text-foreground font-medium text-base">
          Additional Comments (Optional)
        </Label>
        <Textarea
          id="comments"
          placeholder="Any additional comments or messages..."
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] min-h-[120px]"
        />
      </div>

      <div className="flex items-start space-x-3 p-4 rounded-lg border border-border/60 bg-background/40 backdrop-blur-sm">
        <Checkbox
          id="emailUpdates"
          checked={formData.emailUpdatesOptIn}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, emailUpdatesOptIn: checked as boolean })
          }
          className="mt-1 border-gold/60 data-[state=checked]:bg-gold data-[state=checked]:text-background"
        />
        <div className="flex-1">
          <Label
            htmlFor="emailUpdates"
            className="text-foreground/90 cursor-pointer text-sm leading-relaxed"
          >
            I would like to receive email updates about future events
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || (isDonor && (!clientSecret || isLoadingPayment))}
        className="w-full bg-gradient-to-r from-gold via-amber to-gold hover:from-gold/90 hover:via-amber/90 hover:to-gold/90 text-background font-bold py-6 text-lg rounded-lg shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Processing..." : isDonor ? "Pay & Submit" : "Submit Entry"}
      </Button>
    </form>
  );
};
