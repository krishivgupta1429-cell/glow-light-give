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
          <Label htmlFor="fullName" className="text-foreground font-medium">
            Full Name <span className="text-amber">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-background/60 backdrop-blur-sm border-border/50 focus:border-gold focus:ring-gold/30 transition-all duration-300 hover:border-gold/50"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Email Address <span className="text-amber">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-background/60 backdrop-blur-sm border-border/50 focus:border-gold focus:ring-gold/30 transition-all duration-300 hover:border-gold/50"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground font-medium">
            Phone Number <span className="text-amber">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="bg-background/60 backdrop-blur-sm border-border/50 focus:border-gold focus:ring-gold/30 transition-all duration-300 hover:border-gold/50"
          />
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="mx-4 text-2xl animate-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Dreidels */}
        <div className="space-y-2">
          <Label htmlFor="dreidels" className="text-foreground font-medium">
            Guess how many dreidels <span className="text-amber">*</span>
          </Label>
          <Input
            id="dreidels"
            placeholder="Enter your guess"
            value={formData.dreidels}
            onChange={(e) => setFormData({ ...formData, dreidels: e.target.value })}
            required
            className="bg-background/60 backdrop-blur-sm border-border/50 focus:border-gold focus:ring-gold/30 transition-all duration-300 hover:border-gold/50"
          />
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="mx-4 text-2xl animate-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Reason */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            Why I enjoy this event <span className="text-amber">*</span>
          </Label>
          <RadioGroup
            value={formData.reason}
            onValueChange={(value) => setFormData({ ...formData, reason: value })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 group">
              <RadioGroupItem value="community" id="community" className="border-gold/50 text-gold" />
              <Label htmlFor="community" className="font-normal cursor-pointer group-hover:text-gold transition-colors">
                Community celebration
              </Label>
            </div>
            <div className="flex items-center space-x-3 group">
              <RadioGroupItem value="tradition" id="tradition" className="border-gold/50 text-gold" />
              <Label htmlFor="tradition" className="font-normal cursor-pointer group-hover:text-gold transition-colors">
                Jewish tradition and culture
              </Label>
            </div>
            <div className="flex items-center space-x-3 group">
              <RadioGroupItem value="family" id="family" className="border-gold/50 text-gold" />
              <Label htmlFor="family" className="font-normal cursor-pointer group-hover:text-gold transition-colors">
                Family-friendly atmosphere
              </Label>
            </div>
            <div className="flex items-center space-x-3 group">
              <RadioGroupItem value="lighting" id="lighting" className="border-gold/50 text-gold" />
              <Label htmlFor="lighting" className="font-normal cursor-pointer group-hover:text-gold transition-colors">
                The beautiful menorah lighting
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="mx-4 text-2xl animate-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Support */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            Would you like to support Menorah in the Square? <span className="text-amber">*</span>
          </Label>
          <RadioGroup
            value={formData.support}
            onValueChange={(value) => setFormData({ ...formData, support: value })}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-3 group">
              <RadioGroupItem value="yes" id="yes" className="border-gold/50 text-gold" />
              <Label htmlFor="yes" className="font-normal cursor-pointer group-hover:text-gold transition-colors">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-3 group">
              <RadioGroupItem value="no" id="no" className="border-gold/50 text-gold" />
              <Label htmlFor="no" className="font-normal cursor-pointer group-hover:text-gold transition-colors">
                No
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center py-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="mx-4 text-2xl animate-flicker">✨</div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Checkbox with description */}
        <div className="space-y-4 bg-gradient-to-br from-gold/5 to-amber/5 p-6 rounded-xl border border-gold/20">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="buildMenorah"
              checked={formData.buildMenorah}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, buildMenorah: checked as boolean })
              }
              className="mt-1 border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <div className="space-y-2">
              <Label
                htmlFor="buildMenorah"
                className="text-base font-semibold text-gold cursor-pointer leading-tight"
              >
                🕎 Help Build a Menorah Out of Cans
              </Label>
              <p className="text-sm text-foreground/80 leading-relaxed">
                This year, we're creating something truly special — a giant menorah made entirely from
                canned goods! After the event, all cans will be donated to local food banks to help
                families in need throughout our community. Your contribution will light up the square
                and warm hearts all season long.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Each can becomes a building block of hope, turning our celebration into a beacon of
                giving.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-gold to-amber text-foreground font-semibold text-lg py-6 rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Submit Entry
        </Button>
      </div>
    </form>
  );
};

export default RaffleForm;
