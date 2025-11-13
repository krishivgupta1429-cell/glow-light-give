import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const StripeProvider = ({ children }: { children: ReactNode }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        
        if (error || !data?.publishableKey) {
          console.error('Failed to fetch Stripe publishable key:', error);
          return;
        }

        setStripePromise(loadStripe(data.publishableKey));
      } catch (err) {
        console.error('Error initializing Stripe:', err);
      }
    };

    initializeStripe();
  }, []);

  if (!stripePromise) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading payment system...</div>
    </div>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};