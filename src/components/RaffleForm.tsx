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
import { submitEntry } from "@/lib/submitEntry";

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

  // Check for status from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    
    if (status === 'success') {
      toast.success("Payment successful! Thank you for your donation. 🎉");
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'cancelled') {
      toast.error("Payment was cancelled. Please try again if you'd like to complete your donation.");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
  const cansAmountUsd = selectedCanOption?.amount || 0;

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

  const totalCharge = sponsorshipTotal + cansAmountUsd;
  const isDonor = totalCharge > 0;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "email") {
      setEmailError("");
    }
    if (name === "phoneNumber") {
      setPhoneNumberError("");
    }
  };

  const handleAreaCodeChange = (value: string) => {
    setFormData({ ...formData, areaCode: value, phoneNumber: "" });
    setAreaCodeError("");
    setPhoneNumberError("");
  };

  const handleReasonChange = (value: string) => {
    setFormData({ ...formData, reason: value, otherReason: "" });
  };

  const handleCansQuantityChange = (value: string) => {
    setFormData({ ...formData, cansQuantity: value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, emailUpdatesOptIn: checked });
  };

  const validateForm = () => {
    let isValid = true;

    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      isValid = false;
    }

    if (!formData.email.trim()) {
      setEmailError("Email is required");
      toast.error("Please enter your email address");
      isValid = false;
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        setEmailError(emailValidation.error || "Invalid email");
        toast.error(emailValidation.error || "Invalid email address");
        isValid = false;
      }
    }

    if (!formData.areaCode) {
      setAreaCodeError("Area code is required");
      toast.error("Please select an area code");
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      setPhoneNumberError("Phone number is required");
      toast.error("Please enter your phone number");
      isValid = false;
    } else {
      const digitsOnly = formData.phoneNumber.replace(/\D/g, "");
      if (digitsOnly.length !== currentPhoneFormat.digits) {
        setPhoneNumberError(
          `Phone number must be ${currentPhoneFormat.digits} digits for ${formData.areaCode}`
        );
        toast.error(
          `Phone number must be ${currentPhoneFormat.digits} digits for this area code`
        );
        isValid = false;
      }
    }

    if (!formData.reason) {
      toast.error("Please select a reason for enjoying this event");
      isValid = false;
    }

    if (formData.reason === "other" && !formData.otherReason.trim()) {
      toast.error("Please tell us why you enjoy this event");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isDonor) {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            sponsorshipIds: formData.sponsorships,
            cansQuantity: cansQuantity,
            fullName: formData.fullName,
            email: formData.email,
            areaCode: formData.areaCode,
            phoneNumber: formData.phoneNumber,
            reason: formData.reason,
            otherReason: formData.otherReason,
            comments: formData.comments,
            emailUpdatesOptIn: formData.emailUpdatesOptIn,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        const result = await submitEntry({
          fullName: formData.fullName,
          email: formData.email,
          areaCode: formData.areaCode,
          phoneNumber: formData.phoneNumber,
          enjoyReason: formData.reason,
          otherEnjoyReason: formData.otherReason,
          sponsorships: formData.sponsorships,
          cansQuantity: formData.cansQuantity,
          comments: formData.comments,
          emailUpdatesOptIn: formData.emailUpdatesOptIn,
        });

        if (result.success) {
          toast.success(
            "Success! ✨ Thank you for being part of our community celebration. Please check your email to verify your entry."
          );
          
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
        } else {
          toast.error(result.error || "Failed to submit entry");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Contact Information</h2>
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            required
            className="bg-background border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            required
            className={`bg-background border-border ${
              emailError ? "border-destructive" : ""
            }`}
          />
          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <div className="flex gap-2">
            <Select value={formData.areaCode} onValueChange={handleAreaCodeChange}>
              <SelectTrigger
                className={`w-32 bg-background border-border ${
                  areaCodeError ? "border-destructive" : ""
                }`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder={currentPhoneFormat.placeholder}
              required
              className={`flex-1 bg-background border-border ${
                phoneNumberError ? "border-destructive" : ""
              }`}
            />
          </div>
          {areaCodeError && (
            <p className="text-sm text-destructive">{areaCodeError}</p>
          )}
          {phoneNumberError && (
            <p className="text-sm text-destructive">{phoneNumberError}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Why do you enjoy this event? *
        </h2>
        <RadioGroup value={formData.reason} onValueChange={handleReasonChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="community" id="community" />
            <Label htmlFor="community" className="font-normal cursor-pointer">
              Brings our community together
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tradition" id="tradition" />
            <Label htmlFor="tradition" className="font-normal cursor-pointer">
              Beautiful tradition
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="celebration" id="celebration" />
            <Label htmlFor="celebration" className="font-normal cursor-pointer">
              Love celebrating with family and friends
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="miracle" id="miracle" />
            <Label htmlFor="miracle" className="font-normal cursor-pointer">
              The miracle and meaning behind it
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other" className="font-normal cursor-pointer">
              Other
            </Label>
          </div>
        </RadioGroup>

        {formData.reason === "other" && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="otherReason">Please specify *</Label>
            <Textarea
              id="otherReason"
              name="otherReason"
              value={formData.otherReason}
              onChange={handleInputChange}
              placeholder="Tell us why you enjoy this event..."
              required
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Become a Sponsor (Optional)
        </h2>
        <p className="text-muted-foreground">
          Support our community event by becoming a sponsor. Select one or more sponsorship levels:
        </p>
        <div className="space-y-3">
          {sponsorshipOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={formData.sponsorships.includes(option.id)}
                onCheckedChange={(checked) =>
                  handleSponsorshipChange(option.id, checked as boolean)
                }
              />
              <Label
                htmlFor={option.id}
                className="font-normal cursor-pointer flex-1"
              >
                {option.label} – ${option.amount}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Purchase Cans (Optional)
        </h2>
        <p className="text-muted-foreground">
          Each can helps spread the light in our community.
        </p>
        <Select
          value={formData.cansQuantity}
          onValueChange={handleCansQuantityChange}
        >
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select number of cans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {canOptions.map((option) => (
              <SelectItem key={option.label} value={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {totalCharge > 0 && (
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Total Charge</span>
            <span className="text-2xl font-bold text-primary">
              ${totalCharge.toFixed(2)} USD
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Additional Comments (Optional)
        </h2>
        <Textarea
          id="comments"
          name="comments"
          value={formData.comments}
          onChange={handleInputChange}
          placeholder="Any additional thoughts or comments..."
          className="bg-background border-border min-h-[120px]"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="emailUpdates"
          checked={formData.emailUpdatesOptIn}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="emailUpdates" className="font-normal cursor-pointer">
          I'd like to receive email updates about future community events
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-6 text-lg font-semibold"
        size="lg"
      >
        {isSubmitting ? "Processing..." : isDonor ? "Pay & Submit" : "Submit Entry"}
      </Button>
    </form>
  );
};

export default RaffleForm;
