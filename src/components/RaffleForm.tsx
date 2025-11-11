import { useState, useRef } from "react";
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
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const RaffleForm = () => {
  const sponsorshipSectionRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    reason: "",
    otherReason: "",
    showSponsorships: false,
    sponsorships: [] as string[],
    cansQuantity: "",
    comments: "",
    emailUpdatesOptIn: false,
  });

  // Can options with quantities and amounts
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

  // Get selected can option details
  const selectedCanOption = canOptions.find(
    (option) => option.label === formData.cansQuantity
  );
  const cansQuantity = selectedCanOption?.quantity || 0;
  const cansAmountUsd = selectedCanOption?.amount || 0;

  // Sponsorship options with amounts
  const sponsorshipOptions = [
    { id: "doughnut", label: "DOUGHNUT SPONSOR", amount: 36 },
    { id: "doughnut-gold", label: "DOUGHNUT GOLD SPONSOR", amount: 72 },
    { id: "doughnut-platinum", label: "DOUGHNUT PLATINUM SPONSOR", amount: 108 },
    { id: "menorah", label: "MENORAH SPONSOR", amount: 180 },
    { id: "menorah-gold", label: "MENORAH GOLD SPONSOR", amount: 360 },
    { id: "menorah-platinum", label: "MENORAH PLATINUM SPONSOR", amount: 540 },
  ];

  // Calculate total sponsorship amount
  const sponsorshipTotal = formData.sponsorships.reduce((total, sponsorshipId) => {
    const option = sponsorshipOptions.find((opt) => opt.id === sponsorshipId);
    return total + (option?.amount || 0);
  }, 0);

  // Handle sponsorship checkbox change
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate otherReason if "other" is selected
    if (formData.reason === "other" && !formData.otherReason.trim()) {
      toast.error("Please tell us why you enjoy this event", {
        description: "The 'Other' option requires a response.",
      });
      return;
    }
    
    toast.success("Thank you for your entry! 🕎", {
      description: "Your raffle submission has been received.",
    });
    console.log("Form submitted:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      <div className="space-y-6">
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
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground font-medium text-base">
            Phone Number <span className="text-gold">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
          />
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="mx-4 text-2xl animate-candle-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Reason */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium text-base">
            I enjoy events like this because: <span className="text-gold">*</span>
          </Label>
          <RadioGroup
            value={formData.reason}
            onValueChange={(value) => {
              setFormData({ ...formData, reason: value, otherReason: value !== "other" ? "" : formData.otherReason });
            }}
            className="space-y-2"
          >
            <Label htmlFor="cultures" className="flex items-center gap-3 min-h-[44px] group px-2 py-2 rounded-lg hover:bg-gold/5 transition-colors duration-200 cursor-pointer">
              <RadioGroupItem value="cultures" id="cultures" className="border-gold/60 text-gold data-[state=checked]:border-gold focus-visible:ring-gold/40" />
              <span className="text-base font-normal text-foreground/90 group-hover:text-gold transition-colors duration-200 leading-relaxed">
                I enjoy learning about other cultures
              </span>
              </Label>
            <Label htmlFor="jewish" className="flex items-center gap-3 min-h-[44px] group px-2 py-2 rounded-lg hover:bg-gold/5 transition-colors duration-200 cursor-pointer">
              <RadioGroupItem value="jewish" id="jewish" className="border-gold/60 text-gold data-[state=checked]:border-gold focus-visible:ring-gold/40" />
              <span className="text-base font-normal text-foreground/90 group-hover:text-gold transition-colors duration-200 leading-relaxed">
                I'm Jewish
              </span>
              </Label>
            <Label htmlFor="support" className="flex items-center gap-3 min-h-[44px] group px-2 py-2 rounded-lg hover:bg-gold/5 transition-colors duration-200 cursor-pointer">
              <RadioGroupItem value="support" id="support" className="border-gold/60 text-gold data-[state=checked]:border-gold focus-visible:ring-gold/40" />
              <span className="text-base font-normal text-foreground/90 group-hover:text-gold transition-colors duration-200 leading-relaxed">
                I like to show my support for the Jewish Community
              </span>
              </Label>
            <Label htmlFor="other" className="flex items-center gap-3 min-h-[44px] group px-2 py-2 rounded-lg hover:bg-gold/5 transition-colors duration-200 cursor-pointer">
              <RadioGroupItem value="other" id="other" className="border-gold/60 text-gold data-[state=checked]:border-gold focus-visible:ring-gold/40" aria-controls="other-reason-textarea" />
              <span className="text-base font-normal text-foreground/90 group-hover:text-gold transition-colors duration-200 leading-relaxed">
                Other
              </span>
              </Label>
          </RadioGroup>
          {/* Conditional textarea for "Other" option */}
          {formData.reason === "other" && (
            <div className="space-y-2 mt-2 pl-8 animate-fade-in">
              <Textarea
                id="other-reason-textarea"
                placeholder="Tell us why you enjoy this event…"
                value={formData.otherReason}
                onChange={(e) => setFormData({ ...formData, otherReason: e.target.value })}
                required={formData.reason === "other"}
                className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] min-h-[100px] resize-y"
                aria-label="Tell us why you enjoy this event"
              />
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="mx-4 text-2xl animate-candle-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Support */}
        <div className="space-y-4">
          {/* Intro line and CTA */}
          <div className="space-y-6">
            <p className="text-foreground font-medium text-base text-left">
              This free community event is made possible by generous donors like you. Please consider supporting and being part of this beautiful celebration.
            </p>
            <div className="flex flex-col items-center space-y-2">
              <Button
                type="button"
                ref={buttonRef}
                onClick={() => {
                  if (formData.showSponsorships) {
                    // Collapse: clear sponsorships and return focus to button
                    setFormData({ ...formData, showSponsorships: false, sponsorships: [] });
                    // Return focus to button after state update
                    setTimeout(() => {
                      buttonRef.current?.focus();
                    }, 0);
                  } else {
                    // Expand: show sponsorships and smooth scroll
                    setFormData({ ...formData, showSponsorships: true });
                    // Smooth scroll to sponsorship section after it renders
                    // Respect prefers-reduced-motion
                    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    setTimeout(() => {
                      if (sponsorshipSectionRef.current) {
                        const firstCheckbox = sponsorshipSectionRef.current.querySelector('[id^="sponsorship-"]');
                        if (firstCheckbox) {
                          firstCheckbox.scrollIntoView({ 
                            behavior: prefersReducedMotion ? 'auto' : 'smooth', 
                            block: 'start' 
                          });
                        } else {
                          sponsorshipSectionRef.current.scrollIntoView({ 
                            behavior: prefersReducedMotion ? 'auto' : 'smooth', 
                            block: 'start' 
                          });
                        }
                      }
                    }, 100);
                  }
                }}
                aria-expanded={formData.showSponsorships}
                aria-controls="sponsorship-section"
                className="px-6 py-2.5 rounded-full font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-gold group"
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 213, 79, 0.5)';
                    e.currentTarget.style.opacity = '0.95';
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onFocus={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.opacity = '0.95';
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                style={{
                  backgroundColor: '#FFD54F',
                  color: '#1A0D00',
                  border: 'none',
                }}
              >
                <span>{formData.showSponsorships ? "Hide Support Options" : "Yes, I'd like to support"}</span>
                {formData.showSponsorships ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
              {!formData.showSponsorships && (
                <p className="text-xs text-foreground/60 text-center flex items-center justify-center gap-1.5">
                  <span>View sponsorship levels</span>
                  <ChevronDown 
                    className="h-3 w-3" 
                    aria-hidden="true" 
                    style={{ 
                      animation: 'bounce-slow-delayed 4s ease-in-out infinite',
                    }} 
                  />
                </p>
              )}
            </div>
          </div>
          
          {/* Conditional Sponsorship Section */}
          {formData.showSponsorships && (
            <div 
              id="sponsorship-section" 
              ref={sponsorshipSectionRef}
              className="space-y-4 mt-4 pt-4 border-t border-gold/20 animate-fade-in" 
              role="region" 
              aria-labelledby="sponsorship-label"
            >
              {/* Label and Checkboxes Layout */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                {/* Left Label */}
                <Label id="sponsorship-label" className="text-foreground font-semibold text-base whitespace-nowrap pt-1">
                  I would like to be a
          </Label>
                
                {/* Right: Vertical List of Checkboxes */}
                <div className="flex-1 space-y-2.5 w-full">
                  {sponsorshipOptions.map((option) => {
                    const isChecked = formData.sponsorships.includes(option.id);
                    return (
                      <div
                        key={option.id}
                        className={`flex items-center space-x-3 group px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
                          isChecked
                            ? "border-gold bg-gold/15 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                            : "border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/50 hover:shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                        }`}
                      >
                        <Checkbox
                          id={`sponsorship-${option.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            handleSponsorshipChange(option.id, checked as boolean);
                          }}
                          className="border-gold/60 data-[state=checked]:bg-gold data-[state=checked]:border-gold ring-offset-background focus-visible:ring-2 focus-visible:ring-gold/40 transition-all duration-200 shrink-0"
                          aria-label={`${option.label} - $${option.amount}`}
                        />
                        <Label
                          htmlFor={`sponsorship-${option.id}`}
                          className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200 flex-1 flex items-center justify-between text-sm md:text-base"
                        >
                          <span className={isChecked ? "text-gold font-medium" : ""}>{option.label}</span>
                          <span className={`font-semibold ml-4 whitespace-nowrap ${isChecked ? "text-gold" : "text-gold/80"}`}>
                            ${option.amount}
                          </span>
              </Label>
            </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Total Charge Row */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gold/30">
                <span className="text-foreground font-semibold text-base md:text-lg">Total Charge</span>
                <span className="text-gold font-bold text-lg md:text-xl">
                  ${sponsorshipTotal.toFixed(2)} USD
                </span>
              </div>
              
              {/* Lamplighter Wall Acknowledgement */}
              <div className="space-y-3 pt-4 mt-4 border-t border-gold/20">
                <p className="text-xs text-foreground/60 text-center">
                  Thank you for your generous support — you're now eligible to be recognized on the Lamplighter Wall.
                </p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    aria-disabled="true"
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-gold/20 via-amber/15 to-gold/20 border border-gold/40 text-gold font-medium cursor-not-allowed opacity-75 hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all duration-200 active:scale-95 relative overflow-hidden"
                    onClick={(e) => {
                      e.preventDefault();
                      // Visual feedback only - no action
                      const button = e.currentTarget;
                      const rect = button.getBoundingClientRect();
                      const ripple = document.createElement('span');
                      const size = Math.max(rect.width, rect.height);
                      const x = e.clientX - rect.left - size / 2;
                      const y = e.clientY - rect.top - size / 2;
                      
                      ripple.style.width = ripple.style.height = `${size}px`;
                      ripple.style.left = `${x}px`;
                      ripple.style.top = `${y}px`;
                      ripple.className = 'absolute rounded-full bg-gold/20 pointer-events-none animate-ping';
                      ripple.style.animationDuration = '0.6s';
                      
                      button.appendChild(ripple);
                      setTimeout(() => ripple.remove(), 600);
                    }}
                  >
                    <span className="relative z-10">Join the Lamplighter Wall</span>
                  </button>
                </div>
              </div>
              
              {/* Hidden inputs for form submission */}
              <input
                type="hidden"
                name="selected_sponsorships"
                value={formData.sponsorships
                  .map((id) => sponsorshipOptions.find((opt) => opt.id === id)?.label)
                  .filter(Boolean)
                  .join(", ")}
              />
              <input
                type="hidden"
                name="sponsorship_total_usd"
                value={sponsorshipTotal.toFixed(2)}
              />
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="mx-4 text-2xl animate-candle-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Informational card - static, non-interactive */}
        <div className="space-y-4 bg-gradient-to-br from-purple-900/20 via-purple-800/15 to-gold/10 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
          {/* Subtle glow effect with purple accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-gold/5 pointer-events-none" />
          {/* Header bar effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-purple-400/40 to-gold/30" />
          <div className="relative z-10 space-y-3">
            {/* Heading */}
            <h3 className="text-base font-semibold text-gold leading-tight flex items-center gap-2">
              <span className="text-lg">🥫</span>
              <span>Help Build a Menorah Out of Cans and Support Those in Need!</span>
            </h3>
            
            {/* Body content */}
            <div className="space-y-2 text-sm text-foreground/80 leading-relaxed">
              <p>
                This year, we're building a menorah entirely out of canned food, which will later be donated to local homeless shelters. You can participate in this meaningful project in two ways:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 ml-2">
                <li>Drop off cans at the Chabad JCC.</li>
                <li>Have us do the shopping for you! And simply select how many cans you'd like to contribute. Each can costs an average of $4.</li>
              </ol>
            </div>
            
            {/* Closing line - smaller, italic */}
            <p className="text-xs text-foreground/70 italic leading-relaxed">
              Each can become a building block of hope, turning our celebration into a beacon of giving.
            </p>
          </div>
        </div>

        {/* Glowing Divider Separator */}
        <div className="flex items-center justify-center py-6 md:py-8 my-4 md:my-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <div className="mx-4 text-2xl animate-candle-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>

        {/* Can Quantity Selector */}
        <div className="space-y-3">
          <div className="relative">
            <Label 
              htmlFor="cansQuantity" 
              className="text-foreground font-bold text-lg md:text-xl block relative pb-2"
            >
              <span className="relative z-10 drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">How many cans would you like us to shop for you?</span>
              {/* Golden underline/highlight effect */}
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
              aria-label="Select quantity of cans"
              className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
            >
              <SelectValue placeholder="Select quantity" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-md border-border/60 text-foreground shadow-lg">
              {canOptions.map((option) => (
                <SelectItem
                  key={option.quantity}
                  value={option.label}
                  className="text-foreground focus:bg-gold/10 focus:text-gold hover:bg-gold/5 cursor-pointer transition-colors"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Helper line */}
          <p className="text-xs text-foreground/60 mt-2">
            We'll purchase and deliver the cans on your behalf for the menorah construction.
          </p>
          
          {/* Hidden inputs for form submission */}
          <input
            type="hidden"
            name="cans_quantity"
            value={cansQuantity}
          />
          <input
            type="hidden"
            name="cans_amount_usd"
            value={cansAmountUsd.toFixed(2)}
          />
        </div>

        {/* Comments / Special Requests */}
        <div className="space-y-2">
          <Label htmlFor="comments" className="text-foreground font-medium text-base">
            Comments or Special Requests
          </Label>
          <Textarea
            id="comments"
            name="comments"
            placeholder="Share your thoughts or any special requests…"
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            className="bg-input/80 backdrop-blur-sm border-border/60 text-foreground placeholder:text-foreground/50 focus:border-gold focus:ring-2 focus:ring-gold/40 transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] min-h-[100px] resize-y"
            aria-label="Comments or special requests"
          />
        </div>

        {/* Email Updates Opt-in */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3 group p-2 rounded-lg hover:bg-gold/5 transition-colors duration-200">
            <Checkbox
              id="emailUpdatesOptIn"
              name="email_updates_opt_in"
              checked={formData.emailUpdatesOptIn}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, emailUpdatesOptIn: checked as boolean })
              }
              className="mt-1 border-gold/60 data-[state=checked]:bg-gold data-[state=checked]:border-gold ring-offset-background focus-visible:ring-2 focus-visible:ring-gold/40 transition-all duration-200"
            />
              <Label
              htmlFor="emailUpdatesOptIn"
              className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200 text-sm leading-relaxed"
              >
              Yes, I would like to receive email updates about future Chabad Traverse City events and programs
              </Label>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full relative overflow-hidden bg-gradient-to-r from-gold via-amber to-gold text-background font-semibold text-lg py-6 rounded-xl shadow-lg hover:shadow-[0_0_40px_rgba(255,215,0,0.6)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-gold/30 group"
        >
          <span className="relative z-10">Submit Entry</span>
          {/* Ripple effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Button>
      </div>
    </form>
  );
};

export default RaffleForm;
