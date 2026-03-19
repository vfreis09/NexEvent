import { useForm } from "react-hook-form";
import { useTheme } from "../../context/ThemeContext";
import "./ForgotPasswordForm.css";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
}

interface ForgotPasswordFormData {
  email: string;
}

function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  useTheme();

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
    <div className="forgot-password-container">
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="forgot-password-card shadow-sm"
      >
        <h3 className="text-center">Forgot Password</h3>
        <p className="forgot-instructions">
          Enter the email address associated with your account and we'll send
          you a link to reset your password.
        </p>
        <input
          type="email"
          className={`form-control mb-3 ${errors.email ? "is-invalid" : ""}`}
          placeholder="Email address"
          disabled={isSubmitting}
          {...register("email", { required: "Please enter your email." })}
        />
        {errors.email && (
          <div className="alert alert-danger py-2 small">
            {errors.email.message}
          </div>
        )}
        {isSubmitSuccessful && !errors.root && (
          <div className="alert alert-success py-2 small">
            If this email exists, a reset link has been sent.
          </div>
        )}
        {errors.root && (
          <div className="alert alert-danger py-2 small">
            {errors.root.message}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending link..." : "Send Reset Link"}
        </button>
        <div className="text-center mt-4">
          <a href="/login" className="text-decoration-none small back-to-login">
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
