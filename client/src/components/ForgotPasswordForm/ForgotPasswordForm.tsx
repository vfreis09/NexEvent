import { useState } from "react";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
}

function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default ForgotPasswordForm;
