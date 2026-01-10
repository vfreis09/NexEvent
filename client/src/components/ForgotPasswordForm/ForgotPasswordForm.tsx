import { useState } from "react";
import { useTheme } from "../../context/ThemeContext"; // 👈 ADDED
import "./ForgotPasswordForm.css";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
}

function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(email.trim());
      setMessage("If this email exists, a reset link has been sent.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-password-container">
      <form onSubmit={handleSubmit} className="forgot-password-card shadow-sm">
        <h3 className="text-center">Forgot Password</h3>
        <p className="forgot-instructions">
          Enter the email address associated with your account and we'll send
          you a link to reset your password.
        </p>

        <input
          type="email"
          className="form-control mb-3"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        {message && (
          <div className="alert alert-success py-2 small">{message}</div>
        )}
        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Sending link..." : "Send Reset Link"}
        </button>
        <div className="text-center mt-4">
          <a
            href="/login"
            className="text-decoration-none small"
            style={{ color: "inherit", opacity: 0.7 }}
          >
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
