import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const RaffleForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dreidels: "",
    reason: "",
    support: "",
    buildMenorah: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

        {/* Dreidels */}
        <div className="space-y-2">
          <Label htmlFor="dreidels" className="text-foreground font-medium text-base">
            Guess how many dreidels <span className="text-gold">*</span>
          </Label>
          <Input
            id="dreidels"
            placeholder="Enter your guess"
            value={formData.dreidels}
            onChange={(e) => setFormData({ ...formData, dreidels: e.target.value })}
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
            Why I enjoy this event <span className="text-gold">*</span>
          </Label>
          <RadioGroup
            value={formData.reason}
            onValueChange={(value) => setFormData({ ...formData, reason: value })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 group p-2 rounded-lg hover:bg-gold/5 transition-colors duration-200">
              <RadioGroupItem value="community" id="community" className="border-gold/60 text-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
              <Label htmlFor="community" className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200">
                Community celebration
              </Label>
            </div>
            <div className="flex items-center space-x-3 group p-2 rounded-lg hover:bg-gold/5 transition-colors duration-200">
              <RadioGroupItem value="tradition" id="tradition" className="border-gold/60 text-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
              <Label htmlFor="tradition" className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200">
                Jewish tradition and culture
              </Label>
            </div>
            <div className="flex items-center space-x-3 group p-2 rounded-lg hover:bg-gold/5 transition-colors duration-200">
              <RadioGroupItem value="family" id="family" className="border-gold/60 text-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
              <Label htmlFor="family" className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200">
                Family-friendly atmosphere
              </Label>
            </div>
            <div className="flex items-center space-x-3 group p-2 rounded-lg hover:bg-gold/5 transition-colors duration-200">
              <RadioGroupItem value="lighting" id="lighting" className="border-gold/60 text-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
              <Label htmlFor="lighting" className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200">
                The beautiful menorah lighting
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="mx-4 text-2xl animate-candle-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Support */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium text-base">
            Would you like to support Menorah in the Square? <span className="text-gold">*</span>
          </Label>
          <RadioGroup
            value={formData.support}
            onValueChange={(value) => setFormData({ ...formData, support: value })}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-3 group p-2 rounded-lg hover:bg-gold/5 transition-colors duration-200">
              <RadioGroupItem value="yes" id="yes" className="border-gold/60 text-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
              <Label htmlFor="yes" className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-3 group p-2 rounded-lg hover:bg-gold/5 transition-colors duration-200">
              <RadioGroupItem value="no" id="no" className="border-gold/60 text-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
              <Label htmlFor="no" className="font-normal cursor-pointer text-foreground/90 group-hover:text-gold transition-colors duration-200">
                No
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="mx-4 text-2xl animate-candle-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Checkbox with description */}
        <div className="space-y-4 bg-gradient-to-br from-purple-900/20 via-purple-800/15 to-gold/10 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
          {/* Subtle glow effect with purple accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-gold/5 pointer-events-none" />
          {/* Header bar effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-purple-400/40 to-gold/30" />
          <div className="flex items-start space-x-3 relative z-10">
            <Checkbox
              id="buildMenorah"
              checked={formData.buildMenorah}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, buildMenorah: checked as boolean })
              }
              className="mt-1 border-purple-400/60 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400 ring-offset-background focus-visible:ring-2 focus-visible:ring-purple-400/40"
            />
            <div className="space-y-2 flex-1">
              <Label
                htmlFor="buildMenorah"
                className="text-base font-semibold text-purple-300 cursor-pointer leading-tight flex items-center gap-2"
              >
                <span className="text-lg">🥫</span>
                <span>Help Build a Menorah Out of Cans</span>
              </Label>
              <p className="text-sm text-foreground/80 leading-relaxed">
                This year, we're creating something truly special — a giant menorah made entirely from
                canned goods! After the event, all cans will be donated to local food banks to help
                families in need throughout our community. Your contribution will light up the square
                and warm hearts.
              </p>
            </div>
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
