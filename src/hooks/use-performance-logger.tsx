import { useEffect } from 'react';

/**
 * Performance logging hook (dev only)
 * Logs total particles, animation count, and longest task after 5s
 */
export const usePerformanceLogger = () => {
  useEffect(() => {
    // Only run in development
    if (import.meta.env.PROD) return;

    const logPerformance = () => {
      // Count particles (if FloatingParticles is rendered)
      const canvas = document.querySelector('canvas');
      const particleCount = canvas ? 'Canvas detected (particles active)' : 'No particles (mobile)';
      
      // Count animations
      const animatedElements = document.querySelectorAll('[class*="animate-"]');
      const animationCount = animatedElements.length;
      
      // Measure longest task using Performance Observer
      let longestTask = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' || entry.entryType === 'longtask') {
            const duration = entry.duration;
            if (duration > longestTask) {
              longestTask = duration;
            }
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['measure', 'longtask'] });
      } catch (e) {
        // Longtask API may not be available
      }
      
      // Log after 5 seconds
      setTimeout(() => {
        console.log('%c🚀 Performance Metrics (Dev Only)', 'color: #FFD54F; font-weight: bold; font-size: 14px;');
        console.log('Particles:', particleCount);
        console.log('Active Animations:', animationCount);
        console.log('Longest Task:', longestTask > 0 ? `${longestTask.toFixed(2)}ms` : 'N/A (Longtask API not available)');
        console.log('Target: No tasks > 100ms');
        
        // Check for long tasks
        if (longestTask > 100) {
          console.warn('⚠️ Long task detected (>100ms):', longestTask.toFixed(2) + 'ms');
        } else {
          console.log('✅ No long tasks detected');
        }
        
        observer.disconnect();
      }, 5000);
    };

    logPerformance();
  }, []);
};

