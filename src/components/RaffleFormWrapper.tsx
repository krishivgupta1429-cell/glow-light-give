import { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from "@/integrations/supabase/client";
import RaffleForm from "./RaffleForm";

export const RaffleFormWrapper = () => {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (error || !data?.publishableKey) {
          console.error('Failed to fetch Stripe publishable key:', error);
          return;
        }
        setStripePromise(loadStripe(data.publishableKey));
      } catch (err) {
        console.error('Error loading Stripe:', err);
      }
    };
    initStripe();
  }, []);

  if (!stripePromise) {
    return <div>Loading...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <RaffleForm />
    </Elements>
  );
};

export default RaffleFormWrapper;
