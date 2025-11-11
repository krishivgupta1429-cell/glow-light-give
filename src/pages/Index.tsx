import { useEffect, useState } from "react";
import FloatingParticles from "@/components/FloatingParticles";
import RaffleForm from "@/components/RaffleForm";
import MenorahCandles from "@/components/MenorahCandles";

const Index = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if mobile (≤768px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    checkMobile();
    mediaQuery.addEventListener('change', handleReducedMotionChange);
    
    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 100);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Rich Dark Gradient Background with Animated Shimmer */}
      <div className="fixed inset-0 bg-shimmer -z-20" />
      
      {/* Additional depth layers - candle light gradients radiating from center */}
      <div className="fixed inset-0 -z-10">
        {/* Central glow behind menorah area */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-amber/20 via-gold/10 to-transparent blur-3xl opacity-60 ${!isMobile && !prefersReducedMotion ? 'animate-gentle-pulse' : ''}`} />
        {/* Secondary warm glows */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-gradient-radial from-amber/15 via-transparent to-transparent blur-3xl opacity-40" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[400px] bg-gradient-radial from-gold/15 via-transparent to-transparent blur-3xl opacity-40" />
        {/* Edge amber warmth */}
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-amber/10 via-transparent to-transparent" />
      </div>
      
      {/* Floating Particles - hidden on mobile */}
      {!isMobile && <FloatingParticles />}

      {/* Content */}
      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-12 md:py-16">
        {/* Hosted by banner */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-gold/10 via-amber/10 to-gold/10 border border-gold/30 backdrop-blur-sm">
            <span className="text-amber-400 text-lg">🔥</span>
            <span className="text-sm font-medium text-foreground/90 tracking-wider">HOSTED BY CHABAD TRAVERSE CITY</span>
            <span className="text-amber-400 text-lg">🔥</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Menorah with Blended Candle Effect */}
          <div className="mb-8 flex justify-center">
            <div className={`relative w-full max-w-[400px] md:max-w-[500px] ${!isMobile && !prefersReducedMotion ? 'animate-float' : ''}`}>
              <MenorahCandles isMobile={isMobile} prefersReducedMotion={prefersReducedMotion} />
            </div>
          </div>

          {/* Title with Golden Gradient */}
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 text-gold-gradient bg-[length:200%_auto] drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] ${!isMobile && !prefersReducedMotion ? 'animate-shimmer' : ''}`}>
            Menorah in The Square
          </h1>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl text-gold-gradient font-light tracking-wide bg-[length:200%_auto] ${!isMobile && !prefersReducedMotion ? 'animate-shimmer' : ''}`}>
            Together We Light the Square.
          </p>
        </div>

        {/* Form Card with Glassmorphism */}
        <div className="relative animate-fade-in animation-delay-200">
          {/* Multiple glow layers behind card for depth */}
          <div className={`absolute -inset-6 bg-gradient-to-br from-gold/30 via-amber/20 to-gold/20 rounded-3xl blur-3xl opacity-40 ${!isMobile && !prefersReducedMotion ? 'animate-gentle-pulse' : ''}`} />
          <div className="absolute -inset-4 bg-gradient-to-br from-gold/20 via-amber/15 to-transparent rounded-3xl blur-2xl opacity-30" />
          
          {/* Main Glass Card */}
          <div className="relative glass-card glass-card-mobile rounded-3xl shadow-2xl shadow-mobile p-8 md:p-12 border border-gold/20">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/5 via-transparent to-amber/5 pointer-events-none" />
            
            {/* Decorative top accent */}
            <div className="flex justify-center mb-8 relative z-10">
              <div className={`text-3xl ${!isMobile && !prefersReducedMotion ? 'animate-candle-flicker' : ''}`}>✨</div>
            </div>

            <div className="relative z-10">
              <RaffleForm />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center animate-fade-in space-y-4 py-6 content-offscreen">
          {/* Main message */}
          <p className="text-lg md:text-xl text-gold font-light tracking-wide drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
            May the lights of Chanukah bring warmth and joy to your home🕎
          </p>
          
          {/* Contact message */}
          <p className="text-sm text-foreground/60 font-normal">
            Questions? Contact Chabad Traverse City
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
