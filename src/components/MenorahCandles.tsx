import { useEffect, useRef } from 'react';

interface MenorahCandlesProps {
  isMobile?: boolean;
  prefersReducedMotion?: boolean;
}

const MenorahCandles = ({ isMobile = false, prefersReducedMotion = false }: MenorahCandlesProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Candle positions - All candles in a perfectly straight horizontal line
  // Center shamash slightly elevated, all other candles at same height
  // Equal spacing: 22 units between candles
  // Uniform height for all candles (shamash can be slightly taller)
  const candles = [
    // Left side (4 candles) - all at same Y position and height
    { x: -88, y: 0, height: 50, side: 'left' },      // Leftmost
    { x: -66, y: 0, height: 50, side: 'left' },       // Second from left
    { x: -44, y: 0, height: 50, side: 'left' },       // Third from left
    { x: -22, y: 0, height: 50, side: 'left' },      // Closest to center
    
    // Center shamash - slightly elevated above others
    { x: 0, y: -5, height: 52, isShamash: true },      // Center (shamash) - elevated
    
    // Right side (4 candles) - all at same Y position and height
    { x: 22, y: 0, height: 50, side: 'right' },       // Closest to center
    { x: 44, y: 0, height: 50, side: 'right' },       // Third from right
    { x: 66, y: 0, height: 50, side: 'right' },       // Second from right
    { x: 88, y: 0, height: 50, side: 'right' },       // Rightmost
  ];

  useEffect(() => {
    // Pause flicker animation on mobile or when reduced motion is preferred
    if (isMobile || prefersReducedMotion) return;
    
    // Add subtle random flicker to each flame using requestAnimationFrame
    let animationFrameId: number;
    let lastTime = 0;
    const interval = 150; // Update every 150ms
    
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= interval) {
        if (svgRef.current) {
          const flames = svgRef.current.querySelectorAll('.flame');
          flames.forEach((flame) => {
            const element = flame as SVGElement;
            const randomOffset = (Math.random() - 0.5) * 1.5;
            const randomScale = 1 + (Math.random() - 0.5) * 0.08;
            element.style.transform = `translateY(${randomOffset}px) scaleY(${randomScale})`;
          });
        }
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isMobile, prefersReducedMotion]);

  return (
    <div className="relative w-full flex justify-center items-center py-6 pt-12 pb-4">
      {/* Outer glow layers - seamless blending with background */}
      <div className={`absolute inset-0 bg-gradient-radial from-amber/20 via-gold/10 to-transparent blur-3xl opacity-40 ${!isMobile && !prefersReducedMotion ? 'animate-gentle-pulse' : ''}`} />
      <div className="absolute inset-0 bg-gradient-radial from-gold/12 to-transparent blur-2xl opacity-25" />
      
      {/* Subtle base lighting effect - soft and refined */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[15px] bg-gradient-to-t from-gold/15 via-amber/8 to-transparent blur-lg opacity-50" />
      
      {/* SVG Menorah - no borders, fully blended */}
      {/* ViewBox shifted down slightly to ensure full flame visibility */}
      <svg
        ref={svgRef}
        viewBox="-110 -35 220 105"
        className="relative z-10 w-full max-w-[400px] md:max-w-[500px] h-auto"
        style={{ 
          filter: 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.3))',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filters for flames */}
          <filter id="flameGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Radial gradients for flames - pure yellow tones */}
          <radialGradient id="flameGradient" cx="50%" cy="20%" r="100%">
            <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
            <stop offset="30%" stopColor="#FFD54F" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#FFC107" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFD54F" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="flameCore" cx="50%" cy="15%" r="70%">
            <stop offset="0%" stopColor="#FFFDE7" stopOpacity="1" />
            <stop offset="50%" stopColor="#FFEB3B" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFD54F" stopOpacity="0.6" />
          </radialGradient>
          
          {/* White candle body gradient - clean and elegant */}
          <linearGradient id="candleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FAFAFA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F5F5F5" stopOpacity="0.85" />
          </linearGradient>
          
          {/* White candle body gradient for shamash */}
          <linearGradient id="candleGradientShamash" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#FAFAFA" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F5F5F5" stopOpacity="0.9" />
          </linearGradient>
          
          {/* Golden base gradient */}
          <linearGradient id="baseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD54F" stopOpacity="1" />
            <stop offset="50%" stopColor="#FFC107" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFB300" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Draw each candle */}
        {candles.map((candle, index) => {
          // Base Y position - all candles align to a common base line, then Y transform creates the arch
          // The Y transform moves the entire candle group up (negative) or down (positive)
          const baseY = 55; // Common base line for all candles
          const candleTopY = baseY - candle.height;
          const isShamash = candle.isShamash;
          
          // Shamash has taller flame to match its elevated position
          // Ensuring full visibility with extra space
          const flameHeight = isShamash ? 15 : 12;
          const flameCoreHeight = isShamash ? 11 : 8;
          const flameHaloHeight = isShamash ? 18 : 15;
          
          return (
            <g key={index} transform={`translate(${candle.x}, ${candle.y})`}>
              {/* Golden base - small base at bottom of candle */}
              <ellipse
                cx="0"
                cy={baseY}
                rx="6"
                ry="3"
                fill="url(#baseGradient)"
                opacity="0.9"
              />
              
              {/* Candle body - white, straight, elegant */}
              <rect
                x="-3.5"
                y={candleTopY}
                width="7"
                height={candle.height}
                fill={isShamash ? "url(#candleGradientShamash)" : "url(#candleGradient)"}
                opacity="0.92"
                rx="1.5"
              />
              
              {/* Candle highlight - subtle shine on left edge */}
              <rect
                x="-3"
                y={candleTopY + 1}
                width="1.5"
                height={candle.height - 2}
                fill="rgba(255, 255, 255, 0.3)"
                opacity="0.5"
                rx="0.5"
              />
              
              {/* Flame glow halo - soft bloom effect above candle */}
              <ellipse
                cx="0"
                cy={candleTopY - 6}
                rx="8"
                ry={flameHaloHeight - 2}
                fill="rgba(255, 213, 79, 0.15)"
                className={!isMobile && !prefersReducedMotion ? 'animate-gentle-pulse' : ''}
                style={{
                  animationDelay: !isMobile && !prefersReducedMotion ? `${index * 0.15}s` : '0s',
                }}
              />
              
              {/* Flame - outer glow layer */}
              <ellipse
                cx="0"
                cy={candleTopY - 8}
                rx="5"
                ry={flameHeight - 1}
                fill="url(#flameGradient)"
                filter="url(#flameGlow)"
                opacity="0.98"
                className={`flame ${!isMobile && !prefersReducedMotion ? 'animate-candle-flicker' : ''}`}
                style={{
                  animationDelay: !isMobile && !prefersReducedMotion ? `${index * 0.2}s` : '0s',
                  transition: 'transform 0.15s ease-out',
                  willChange: !isMobile && !prefersReducedMotion ? 'transform' : 'auto',
                }}
              />
              
              {/* Flame - inner bright core */}
              <ellipse
                cx="0"
                cy={candleTopY - 10}
                rx="3"
                ry={flameCoreHeight - 1}
                fill="url(#flameCore)"
                opacity="1"
                className={`flame ${!isMobile && !prefersReducedMotion ? 'animate-candle-flicker' : ''}`}
                style={{
                  animationDelay: !isMobile && !prefersReducedMotion ? `${index * 0.2}s` : '0s',
                  transition: 'transform 0.15s ease-out',
                  willChange: !isMobile && !prefersReducedMotion ? 'transform' : 'auto',
                }}
              />
              
              {/* Additional soft glow around each candle */}
              <circle
                cx="0"
                cy={candleTopY - 6}
                r="5"
                fill="rgba(255, 213, 79, 0.08)"
                className={!isMobile && !prefersReducedMotion ? 'animate-gentle-pulse' : ''}
                style={{
                  animationDelay: !isMobile && !prefersReducedMotion ? `${index * 0.12}s` : '0s',
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MenorahCandles;

