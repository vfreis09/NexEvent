import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

type VerifyStatus = "verifying" | "success" | "error";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [showFallback, setShowFallback] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn, loadUser } = useUser();

  const handleNavigate = () => {
    navigate(isLoggedIn ? "/" : "/login");
  };

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/verify-email?token=${token}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();
        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting...");

          await loadUser();

          setShowFallback(true);

          setTimeout(() => {
            handleNavigate();
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Email verification failed.");
      }
    };

    verifyEmail();
  }, [searchParams, navigate, loadUser, isLoggedIn]);

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-5 flex justify-center">
          {status === "verifying" && (
            <Loader2 size={40} className="animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle2
              size={40}
              className="text-green-600 dark:text-green-500"
            />
          )}
          {status === "error" && (
            <XCircle size={40} className="text-destructive" />
          )}
        </div>

        <h1 className="mb-2 text-xl font-semibold text-card-foreground">
          Email Verification
        </h1>
        <p
          className={cn(
            "text-sm",
            status === "error"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {message}
        </p>

        {showFallback && (
          <Button onClick={handleNavigate} className="mt-6 w-full">
            Go to Home Page
          </Button>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;