import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentHandlerProps {
  onPaymentComplete: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  formData: {
    fullName: string;
    email: string;
    areaCode: string;
    phoneNumber: string;
    sponsorships: string[];
  };
  totalAmount: number;
  cansQuantity: number;
  clientSecret: string;
  paymentIntentId: string;
  submissionId: string;
}

export const usePaymentHandler = () => {
  const stripe = useStripe();
  const elements = useElements();

  const confirmPayment = async ({
    clientSecret,
    formData,
    onSuccess,
    onError,
  }: {
    clientSecret: string;
    formData: PaymentHandlerProps['formData'];
    onSuccess: (paymentIntentId: string) => void;
    onError: (error: string) => void;
  }) => {
    if (!stripe || !elements) {
      onError("Payment system not ready. Please wait a moment and try again.");
      return false;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError("Please enter your card information.");
      return false;
    }

    try {
      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.fullName,
              email: formData.email,
              phone: `${formData.areaCode}${formData.phoneNumber}`,
            },
          },
        }
      );

      if (confirmError) {
        onError(confirmError.message || "Payment could not be processed.");
        return false;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        return true;
      }

      onError("Payment status unclear. Please contact support.");
      return false;
    } catch (err) {
      console.error('Payment confirmation error:', err);
      onError("An unexpected error occurred during payment.");
      return false;
    }
  };

  return { confirmPayment, isReady: !!stripe && !!elements };
};
