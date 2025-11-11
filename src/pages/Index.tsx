import FloatingParticles from "@/components/FloatingParticles";
import RaffleForm from "@/components/RaffleForm";
import menorahHero from "@/assets/menorah-hero.png";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-sky-blue/40 via-ivory to-gold-light/30 -z-10" />
      
      {/* Floating Particles */}
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Menorah Image */}
          <div className="mb-8 flex justify-center">
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-radial from-warm-glow/30 to-transparent blur-3xl" />
              <img
                src={menorahHero}
                alt="Menorah"
                className="h-24 md:h-32 w-auto relative z-10 drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-gold via-amber to-gold bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto] drop-shadow-lg">
            Menorah in The Square
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-foreground/80 font-light">
            Raffle Entry
          </p>
        </div>

        {/* Form Card */}
        <div className="relative animate-fade-in animation-delay-200">
          {/* Glow effect behind card */}
          <div className="absolute -inset-4 bg-gradient-to-br from-gold/20 via-amber/10 to-gold-light/20 rounded-3xl blur-2xl opacity-50" />
          
          {/* Main Card */}
          <div className="relative bg-gradient-to-br from-white/90 via-ivory/85 to-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
            {/* Decorative top accent */}
            <div className="flex justify-center mb-8">
              <div className="text-3xl animate-flicker">✨</div>
            </div>

            <RaffleForm />
          </div>
        </div>

        {/* Footer Glow */}
        <div className="mt-16 text-center">
          <p className="text-sm text-foreground/60 font-light">
            Spreading light and warmth this Hanukkah season 🕎
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
