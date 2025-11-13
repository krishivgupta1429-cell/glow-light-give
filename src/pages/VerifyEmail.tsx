import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-email-token", {
          body: { token },
        });

        if (error) {
          console.error("Verification error:", error);
          setStatus("error");
          setMessage("Failed to verify email. Please try again.");
          return;
        }

        if (data.success) {
          setStatus("success");
          setMessage(data.alreadyVerified 
            ? "Your email was already verified!" 
            : "Your email has been verified successfully!");
        } else if (data.expired) {
          setStatus("expired");
          setMessage(data.error || "Verification link has expired");
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid verification link");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-8 text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-gold animate-spin" />
            <h1 className="text-2xl font-bold text-foreground">Verifying your email...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold text-foreground">Success! ✨</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-foreground">Thank you for being part of our community celebration.</p>
            <Button 
              onClick={handleReturnHome}
              className="w-full bg-gold hover:bg-gold/90 text-primary font-semibold"
            >
              Return to Home
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button 
              onClick={handleReturnHome}
              className="w-full bg-gold hover:bg-gold/90 text-primary font-semibold"
            >
              Return to Home
            </Button>
          </>
        )}

        {status === "expired" && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-orange-500" />
            <h1 className="text-2xl font-bold text-foreground">Link Expired</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Please submit the form again to receive a new verification email.</p>
            <Button 
              onClick={handleReturnHome}
              className="w-full bg-gold hover:bg-gold/90 text-primary font-semibold"
            >
              Return to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
