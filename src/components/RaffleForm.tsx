import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { validateEmail } from "@/lib/emailValidation";
import { supabase } from "@/integrations/supabase/client";

const RaffleForm = () => {
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

  // Check for success/cancel query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    
    if (checkoutStatus === 'success') {
      toast.success("Success! ✨", {
        description: "Thank you for being part of our community celebration.",
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutStatus === 'cancel') {
      toast.error("Payment Canceled", {
        description: "Payment was canceled. Your entry has not been recorded.",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Phone format mapping by area code
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

  // Can options
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

  // Sponsorship options
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
    if (email) {
      const validation = validateEmail(email);
      setEmailError(validation.error || "");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalAmount = sponsorshipTotal + cansAmountUsd;
    const isDonor = totalAmount > 0;

    if (emailError) {
      toast.error("Validation Error", {
        description: "Please fix all errors before submitting.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isDonor) {
        // DONOR PATH: Redirect to Stripe Checkout
        const { data, error } = await supabase.functions.invoke(
          'create-checkout-session',
          {
            body: formData,
          }
        );

        if (error || !data?.url) {
          toast.error("Payment Error", {
            description: "Failed to initialize payment. Please try again.",
          });
          setIsSubmitting(false);
          return;
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      } else {
        // NON-DONOR PATH: Save to database
        const { data: saveData, error: saveError } = await supabase.functions.invoke(
          'save-donation-submission',
          {
            body: {
              formData: {
                ...formData,
                enjoyReason: formData.reason,
                otherEnjoyReason: formData.otherReason,
                totalAmount: 0,
                cansAmount: 0,
                wantsEmailUpdates: formData.emailUpdatesOptIn,
                sponsorships: 0,
                cansQuantity: 0,
              },
              submissionId: null,
              paymentIntentId: null,
              isDonor: false,
            },
          }
        );

        if (saveError || !saveData) {
          toast.error("Submission Failed", {
            description: "Failed to save your entry. Please try again.",
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
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Submission Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = sponsorshipTotal + cansAmountUsd;
  const isDonor = totalAmount > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 md:space-y-8 w-full form-mobile">
      <div className="space-y-4 md:space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-foreground font-medium text-base">
            Full Name <span className="text-gold">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
          />
        </div>

        {/* Email */}
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
            className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
          />
          {emailError && (
            <p className="text-sm text-red-400">{emailError}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-foreground font-medium text-base">
            Phone Number <span className="text-gold">*</span>
          </Label>
          <div className="flex gap-2">
            <Select
              value={formData.areaCode}
              onValueChange={(value) => {
                setFormData({ ...formData, areaCode: value });
                setAreaCodeError("");
              }}
            >
              <SelectTrigger
                id="areaCode"
                className="w-[120px] bg-input/80 backdrop-blur-sm border-border/60 text-foreground focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60"
              >
                <SelectValue placeholder="Code" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-lg border-border">
                <SelectItem value="+1">🇺🇸 +1</SelectItem>
                <SelectItem value="+44">🇬🇧 +44</SelectItem>
                <SelectItem value="+91">🇮🇳 +91</SelectItem>
                <SelectItem value="+61">🇦🇺 +61</SelectItem>
                <SelectItem value="+971">🇦🇪 +971</SelectItem>
                <SelectItem value="+972">🇮🇱 +972</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder={currentPhoneFormat.placeholder}
              value={formData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, phoneNumber: value });
                setPhoneNumberError("");
              }}
              required
              className="flex-1 bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
            />
          </div>
          {(areaCodeError || phoneNumberError) && (
            <p className="text-sm text-red-400">{areaCodeError || phoneNumberError}</p>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium text-base">
            What do you enjoy most about the JCC? <span className="text-gold">*</span>
          </Label>
          <RadioGroup
            value={formData.reason}
            onValueChange={(value) => setFormData({ ...formData, reason: value })}
            required
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Programs" id="programs" className="border-border/60" />
              <Label htmlFor="programs" className="font-normal cursor-pointer text-foreground/90">
                Programs
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Services" id="services" className="border-border/60" />
              <Label htmlFor="services" className="font-normal cursor-pointer text-foreground/90">
                Services
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Community" id="community" className="border-border/60" />
              <Label htmlFor="community" className="font-normal cursor-pointer text-foreground/90">
                Community
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Events" id="events" className="border-border/60" />
              <Label htmlFor="events" className="font-normal cursor-pointer text-foreground/90">
                Events
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Other" id="other" className="border-border/60" />
              <Label htmlFor="other" className="font-normal cursor-pointer text-foreground/90">
                Other
              </Label>
            </div>
          </RadioGroup>

          {formData.reason === "Other" && (
            <Input
              placeholder="Please specify"
              value={formData.otherReason}
              onChange={(e) => setFormData({ ...formData, otherReason: e.target.value })}
              className="mt-2 bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
            />
          )}
        </div>

        {/* Sponsorship Options */}
        <div className="space-y-4">
          <div className="relative">
            <Label className="text-foreground font-bold text-lg md:text-xl block relative pb-2">
              <span className="relative z-10 drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">
                Sponsorship Opportunities
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-70 animate-pulse" />
              <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
            </Label>
            <p className="text-sm text-foreground/70 mt-2">
              Choose one or more sponsorship levels (optional)
            </p>
          </div>
          <div className="space-y-2">
            {sponsorshipOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={formData.sponsorships.includes(option.id)}
                  onCheckedChange={(checked) => handleSponsorshipChange(option.id, checked as boolean)}
                  className="border-border/60"
                />
                <Label
                  htmlFor={option.id}
                  className="font-normal cursor-pointer text-foreground/90"
                >
                  {option.label} – ${option.amount}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Informational Card */}
        <div className="space-y-4 bg-gradient-to-br from-purple-900/20 via-purple-800/15 to-gold/10 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-gold/5 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-purple-400/40 to-gold/30" />
          <div className="relative z-10 space-y-3">
            <h3 className="text-base font-semibold text-gold leading-tight flex items-center gap-2">
              <span className="text-lg">🥫</span>
              <span>Help Build a Menorah Out of Cans and Support Those in Need!</span>
            </h3>
            <div className="space-y-2 text-sm text-foreground/80 leading-relaxed">
              <p>
                This year, we're building a menorah entirely out of canned food, which will later be donated to local homeless shelters. You can participate in this meaningful project in two ways:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 ml-2">
                <li>Drop off cans at the Chabad JCC.</li>
                <li>Have us do the shopping for you! And simply select how many cans you'd like to contribute. Each can costs an average of $4.</li>
              </ol>
            </div>
            <p className="text-xs text-foreground/70 italic leading-relaxed">
              Each can become a building block of hope, turning our celebration into a beacon of giving.
            </p>
          </div>
        </div>

        {/* Can Quantity Selector */}
        <div className="space-y-3">
          <div className="relative">
            <Label 
              htmlFor="cansQuantity" 
              className="text-foreground font-bold text-lg md:text-xl block relative pb-2"
            >
              <span className="relative z-10 drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">How many cans would you like us to shop for you?</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-70 animate-pulse" />
              <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
            </Label>
          </div>
          <Select
            value={formData.cansQuantity}
            onValueChange={(value) => setFormData({ ...formData, cansQuantity: value })}
          >
            <SelectTrigger
              id="cansQuantity"
              className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60"
            >
              <SelectValue placeholder="Select quantity (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-lg border-border max-h-[300px]">
              {canOptions.map((option) => (
                <SelectItem key={option.label} value={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <Label htmlFor="comments" className="text-foreground font-medium text-base">
            Additional Comments (optional)
          </Label>
          <Textarea
            id="comments"
            placeholder="Any additional thoughts or comments"
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            rows={4}
            className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] resize-none"
          />
        </div>

        {/* Email Updates Opt-in */}
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="emailUpdates"
            checked={formData.emailUpdatesOptIn}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, emailUpdatesOptIn: checked as boolean })
            }
            className="mt-1 border-border/60"
          />
          <Label
            htmlFor="emailUpdates"
            className="text-sm text-foreground/80 font-normal cursor-pointer leading-relaxed"
          >
            I'd like to receive email updates about upcoming events and programs at the JCC
          </Label>
        </div>

        {/* Total Charge Display */}
        {totalAmount > 0 && (
          <div className="pt-4 border-t border-gold/20">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-foreground">Total Charge:</span>
              <span className="text-gold">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-gold via-amber to-gold hover:from-gold/90 hover:via-amber/90 hover:to-gold/90 text-background font-bold py-6 text-lg shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gold/30"
      >
        {isSubmitting ? "Processing..." : isDonor ? "Pay & Submit" : "Submit Entry"}
      </Button>
    </form>
  );
};

export default RaffleForm;
