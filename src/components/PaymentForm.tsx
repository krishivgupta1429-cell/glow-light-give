import { CardElement } from '@stripe/react-stripe-js';
import { Label } from '@/components/ui/label';

interface PaymentFormProps {
  totalAmount: number;
}

export const PaymentForm = ({ totalAmount }: PaymentFormProps) => {
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
                  color: 'hsl(var(--foreground))',
                  '::placeholder': {
                    color: 'hsl(var(--foreground) / 0.5)',
                  },
                  backgroundColor: 'transparent',
                },
                invalid: {
                  color: '#ef4444',
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
    </div>
  );
};