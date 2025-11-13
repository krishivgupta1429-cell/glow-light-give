import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface PaymentConfirmWrapperProps {
  stripePromise: Promise<Stripe | null> | null;
  clientSecret: string;
  children: ReactNode;
}

export const PaymentConfirmWrapper = ({ 
  stripePromise, 
  clientSecret, 
  children 
}: PaymentConfirmWrapperProps) => {
  if (!stripePromise || !clientSecret) {
    return <>{children}</>;
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#FFD700',
            colorBackground: 'rgba(0, 0, 0, 0.4)',
            colorText: '#ffffff',
            colorDanger: '#ef4444',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: '6px',
          },
        },
      }}
    >
      {children}
    </Elements>
  );
};
