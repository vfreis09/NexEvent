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
    <div className="forgot-password-container d-flex justify-content-center align-items-center">
      <form
        onSubmit={handleSubmit}
        className="card forgot-password-card shadow-sm d-flex flex-column"
      >
        <div>
          <h3 className="mb-4 text-center">Forgot Password</h3>
          <input
            type="email"
            className="form-control mb-3"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {message && <p className="text-success mt-3">{message}</p>}
          {error && <p className="text-danger mt-3">{error}</p>}
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100 mt-auto"
          disabled={loading}
        >
          {loading ? "Sending..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
