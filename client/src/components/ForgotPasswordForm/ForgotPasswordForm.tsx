import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
}

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormData>();

  const onFormSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await onSubmit(data.email.trim());
    } catch {
      setError("root", { message: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl transition-all">
        
        {/* HEADER */}
        <div className="text-center">
          <h3 className="font-mono text-2xl font-bold tracking-tight text-foreground">
            Reset Password
          </h3>
          <p className="mt-2 text-xs font-mono text-muted-foreground leading-relaxed">
            Enter your account email and we will send you instructions to reset your password.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="mt-6 space-y-4">
          
          {/* EMAIL FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              Email
            </label>
            <div className="relative flex items-center">
              <Input
                type="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                {...register("email", { required: "Please enter your email." })}
                className={`w-full !h-11 border-border bg-muted/20 text-foreground text-sm font-mono focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-colors ${
                  errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] font-mono text-destructive flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* SUCCESS MESSAGE */}
          {isSubmitSuccessful && !errors.root && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-500 text-xs font-mono">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>If an account exists for this email, a reset link has been sent.</span>
            </div>
          )}

          {/* ROOT ERROR */}
          {errors.root && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs font-mono">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errors.root.message}</span>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs font-bold tracking-wider !h-11 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              "Sending link..."
            ) : (
              <>
                <Mail size={15} />
                SEND RESET LINK
              </>
            )}
          </Button>

        </form>

        {/* BACK TO LOGIN */}
        <div className="mt-6 text-center border-t border-border/60 pt-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground no-underline transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordForm;