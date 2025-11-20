import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled");
  
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPayment = async () => {
      if (!sessionId) {
        setError("No payment session found");
        setLoading(false);
        return;
      }

      if (canceled) {
        setError("Payment was canceled");
        setLoading(false);
        return;
      }

      try {
        // First, get the Stripe session details
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          "retrieve-checkout-session",
          {
            body: { session_id: sessionId },
          }
        );

        if (stripeError) throw stripeError;

        // Then check the database for the actual payment status
        const { data: submissions, error: dbError } = await supabase
          .from("form_submissions")
          .select("payment_status, payment_amount_cents, email, full_name")
          .eq("stripe_checkout_session_id", sessionId)
          .maybeSingle();

        if (dbError) {
          console.error("Database error:", dbError);
        }

        // Combine data from both sources
        const combinedData = {
          ...stripeData,
          db_payment_status: submissions?.payment_status || "pending",
          amount_total: submissions?.payment_amount_cents || stripeData.amount_total,
          customer_email: submissions?.email || stripeData.customer_email,
          full_name: submissions?.full_name,
        };

        setPaymentData(combinedData);
        
        // Check database status first, fall back to Stripe status
        const finalStatus = submissions?.payment_status || 
          (stripeData.payment_status === "paid" ? "success" : "pending");
        
        if (finalStatus === "fail") {
          setError("Payment failed");
        } else if (finalStatus === "pending") {
          setError("Payment is being processed");
        } else if (finalStatus !== "success") {
          setError("Payment was not successful");
        }
      } catch (err) {
        console.error("Error checking payment:", err);
        setError("Failed to verify payment status");
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, [sessionId, canceled]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 shadow-xl">
        {loading ? (
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Checking your payment...
            </h2>
            <p className="text-muted-foreground">Please wait a moment</p>
          </div>
        ) : error || !paymentData || (paymentData.db_payment_status !== "success" && paymentData.payment_status !== "paid") ? (
          <div className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Payment Failed or Canceled
            </h2>
            <p className="text-muted-foreground mb-6">
              {error || "Your payment was not completed successfully."}
            </p>
            <Link to="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Payment Successful!
            </h2>
            <p className="text-muted-foreground mb-4">
              Thank you for your generous contribution.
            </p>
            <div className="bg-muted/30 rounded-md p-4 mb-6 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-foreground">
                  ${(paymentData.amount_total / 100).toFixed(2)} {paymentData.currency?.toUpperCase()}
                </span>
              </div>
              {paymentData.customer_email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground">{paymentData.customer_email}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email will be sent to you shortly.
            </p>
            <Link to="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
