import { useEffect, useRef } from 'react';

const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();

    interface Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
      baseOpacity: number;
      twinkle: number;
      twinkleSpeed: number;
      color: string;
    }

    const particles: Particle[] = [];
    // Reduce particle count on mobile for performance (60-70% reduction)
    const isMobile = window.innerWidth <= 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Desktop: 80, Mobile: 24-32 (70% reduction)
    const particleCount = (isMobile || prefersReducedMotion) ? 24 : 80;
    
    // Frame rate limiting for mobile (30fps = ~33ms per frame)
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    // Gold color variations
    const goldColors = [
      'rgba(255, 215, 0,', // Gold
      'rgba(255, 193, 7,', // Amber gold
      'rgba(255, 165, 0,', // Orange gold
      'rgba(255, 223, 0,', // Light gold
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 4 + 1.5, // Slightly larger particles
        vx: (Math.random() * 0.6 - 0.3) * 0.5, // Slower, more gentle movement
        vy: (Math.random() * -0.8 - 0.3) * 0.5,
        opacity: (isMobile || prefersReducedMotion) 
          ? (Math.random() * 0.2 + 0.1) // 30-40% reduction on mobile
          : (Math.random() * 0.6 + 0.3),
        baseOpacity: (isMobile || prefersReducedMotion)
          ? (Math.random() * 0.2 + 0.1)
          : (Math.random() * 0.6 + 0.3),
        twinkle: Math.random() * Math.PI * 2, // Random starting phase for twinkle
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
      });
    }

    // Use Page Visibility API to pause when tab is hidden
    let animationFrameId: number;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause animation when tab is hidden
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      } else {
        // Resume animation when tab is visible
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

    const animate = (currentTime: number) => {
      // Skip if page is hidden
      if (document.hidden) {
        return;
      }
      
      // Frame rate limiting for mobile
      if (isMobile && currentTime - lastFrameTime < frameInterval) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      // Clear with slight fade for trailing effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Update twinkle animation
        particle.twinkle += particle.twinkleSpeed;
        particle.opacity = particle.baseOpacity + Math.sin(particle.twinkle) * 0.2;

        // Wrap around edges
        if (particle.y < -20) {
          particle.y = canvas.height + 20;
          particle.x = Math.random() * canvas.width;
        }

        if (particle.y > canvas.height + 20) {
          particle.y = -20;
          particle.x = Math.random() * canvas.width;
        }

        if (particle.x < -20) {
          particle.x = canvas.width + 20;
          particle.y = Math.random() * canvas.height;
        }

        if (particle.x > canvas.width + 20) {
          particle.x = -20;
          particle.y = Math.random() * canvas.height;
        }

        // Create radial gradient for glow effect
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 3
        );
        
        // Inner bright core
        gradient.addColorStop(0, `${particle.color}${particle.opacity})`);
        // Middle glow
        gradient.addColorStop(0.5, `${particle.color}${particle.opacity * 0.5})`);
        // Outer fade
        gradient.addColorStop(1, `${particle.color}0)`);

        // Draw main particle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw bright core
        ctx.fillStyle = `${particle.color}${Math.min(particle.opacity + 0.3, 1)})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle sparkle for some particles
        if (particle.radius > 2.5 && Math.random() > 0.95) {
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.8})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Debounced resize handler - batch reads/writes with requestAnimationFrame
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          setCanvasSize();
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ 
        mixBlendMode: 'screen',
        transform: 'translateZ(0)', // GPU acceleration
        willChange: 'contents'
      }}
    />
  );
};

export default FloatingParticles;
