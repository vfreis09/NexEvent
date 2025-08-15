import { useState } from "react";
import "./ResetPasswordForm.css";

interface ResetPasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
}

function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(password.trim());
      setMessage("Password reset successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-password-container d-flex justify-content-center align-items-center">
      <form
        className="card reset-password-card shadow-sm d-flex flex-column"
        onSubmit={handleSubmit}
      >
        <div>
          <h3 className="mb-4 text-center">Reset Password</h3>
          <input
            type="password"
            className="form-control mb-3"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
