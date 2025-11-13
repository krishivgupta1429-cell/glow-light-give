import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Label } from '@/components/ui/label';

interface PaymentCardSectionProps {
  totalAmount: number;
  isLoading?: boolean;
}

export const PaymentCardSection = ({ totalAmount, isLoading }: PaymentCardSectionProps) => {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="space-y-4 mt-6 p-6 rounded-lg border border-gold/30 bg-background/40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold text-foreground">
          💳 Payment Details
        </Label>
        <span className="text-gold font-semibold">
          ${totalAmount.toFixed(2)}
        </span>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-center text-muted-foreground">
          Loading payment form...
        </div>
      ) : !stripe || !elements ? (
        <div className="p-4 text-center text-muted-foreground">
          Initializing payment system...
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="card-element" className="text-foreground/90">
            Card Information
          </Label>
          <div className="p-4 rounded-md border border-border/60 bg-input/80 backdrop-blur-sm hover:border-gold/60 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/40 transition-all duration-300">
            <CardElement
              id="card-element"
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                    backgroundColor: 'transparent',
                  },
                  invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444',
                  },
                },
                hidePostalCode: false,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your payment is secured by Stripe. We never store your card details.
          </p>
        </div>
      )}
    </div>
  );
};

// Export hooks for use in parent component
export { useStripe, useElements, CardElement };
