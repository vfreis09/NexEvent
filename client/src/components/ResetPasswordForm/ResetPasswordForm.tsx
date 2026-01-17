import { useState, useEffect } from "react";
import zxcvbn from "zxcvbn";
import { getPasswordFeedback, isStrongPassword } from "../../utils/password";
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
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedbackList, setPasswordFeedbackList] = useState<string[]>(
    []
  );

  useEffect(() => {
    const result = zxcvbn(password);
    setPasswordScore(result.score);
    setPasswordFeedbackList(getPasswordFeedback(password));
  }, [password]);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return "red";
      case 1:
        return "orangered";
      case 2:
        return "orange";
      case 3:
        return "yellowgreen";
      case 4:
        return "green";
      default:
        return "gray";
    }
  };

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

    if (!isStrongPassword(password)) {
      setError("Please fix your password according to the criteria below.");
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
        <h3 className="mb-4 text-center">Reset Password</h3>
        <input
          type="password"
          className="form-control mb-2"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {password && (
          <div className="password-feedback mb-3">
            <div style={{ color: getStrengthColor(passwordScore) }}>
              Strength: {getStrengthLabel(passwordScore)}
            </div>
            {passwordFeedbackList.length > 0 && (
              <ul
                className="mb-0 mt-1"
                style={{ color: "red", paddingLeft: "18px" }}
              >
                {passwordFeedbackList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <input
          type="password"
          className="form-control mb-3"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
        {message && <p className="text-success mt-2">{message}</p>}
        {error && <p className="text-danger mt-2">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
