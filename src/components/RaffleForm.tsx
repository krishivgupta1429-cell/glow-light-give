import { useState, useEffect } from "react";
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from "@/integrations/supabase/client";
import { RaffleFormContent } from "./RaffleFormContent";

const RaffleForm = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<string>("");
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  // Load Stripe publishable key from backend on mount
  useEffect(() => {
    const initStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (error || !data?.publishableKey) {
          console.error('Failed to load Stripe publishable key:', error);
          return;
        }
        setStripePromise(loadStripe(data.publishableKey));
      } catch (err) {
        console.error('Error initializing Stripe:', err);
      }
    };
    initStripe();
  }, []);

  // Function to create payment intent when user selects sponsorships
  const createPaymentIntent = async (sponsorshipIds: string[], cansQuantity: number, formData: { fullName: string; email: string }) => {
    if (sponsorshipIds.length === 0) {
      // No donation selected, clear payment intent
      setClientSecret("");
      setPaymentIntentId("");
      setSubmissionId("");
      return;
    }

    setIsLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          sponsorshipIds,
          cansQuantity,
          formData: {
            fullName: formData.fullName,
            email: formData.email,
          },
        },
      });

      if (error || !data) {
        console.error('Failed to create payment intent:', error);
        setClientSecret("");
        setPaymentIntentId("");
        setSubmissionId("");
        return;
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setSubmissionId(data.submissionId);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setClientSecret("");
      setPaymentIntentId("");
      setSubmissionId("");
    } finally {
      setIsLoadingPayment(false);
    }
  };

  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading payment system...</div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <RaffleFormContent
        createPaymentIntent={createPaymentIntent}
        clientSecret={clientSecret}
        paymentIntentId={paymentIntentId}
        submissionId={submissionId}
        isLoadingPayment={isLoadingPayment}
      />
    </Elements>
  );
};

export default RaffleForm;
