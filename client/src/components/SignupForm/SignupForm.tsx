import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import zxcvbn from "zxcvbn";
import { useUser } from "../../context/UserContext";
import { getPasswordFeedback } from "../../utils/password";
import { useToast } from "../../hooks/useToast";
import { useTheme } from "../../context/ThemeContext";
import AppToast from "../ToastComponent/ToastComponent";
import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import "./SignupForm.css";

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [wantsNotifications, setWantsNotifications] = useState(false);

  const [passwordScoreDisplay, setPasswordScoreDisplay] = useState(0);
  const [passwordFeedbackListDisplay, setPasswordFeedbackListDisplay] =
    useState<string[]>([]);

  useTheme();

  const navigate = useNavigate();
  const { loadUser, isLoggedIn } = useUser();
  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  useEffect(() => {
    if (isLoggedIn) navigate("/", { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const result = zxcvbn(password);
    setPasswordScoreDisplay(result.score);
    setPasswordFeedbackListDisplay(getPasswordFeedback(password));
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
        return "text-danger";
      case 1:
        return "text-warning";
      case 2:
        return "text-warning";
      case 3:
        return "text-success";
      case 4:
        return "text-success";
      default:
        return "text-muted";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentPasswordScore = zxcvbn(password).score;

    if (currentPasswordScore < 2) {
      showNotification("Please choose a stronger password.", "Error", "danger");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password, wantsNotifications }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      await loadUser();

      showNotification(
        "Account created! Please check your email to verify your account.",
        "Success",
        "success"
      );

      setTimeout(() => {
        navigate("/", {
          state: {
            successMessage:
              "Account created! Please check your email to verify your account.",
          },
        });
      }, 2000);
    } catch (error: any) {
      console.error("Signup failed", error);
      showNotification(error.message || "Signup failed", "Error", "danger");
    }
  };

  return (
    <>
      {showToast && toastInfo && (
        <AppToast
          show={showToast}
          message={toastInfo.message}
          header={toastInfo.header}
          bg={toastInfo.bg}
          textColor={toastInfo.textColor}
          onClose={hideToast}
        />
      )}
      <form onSubmit={handleSubmit} className="signup-form">
        <h1 className="text-center mb-4">Register</h1>
        <div className="mb-3">
          <input
            placeholder="Email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            placeholder="Username"
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            placeholder="Password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password && (
            <div className="password-feedback mt-2 mb-3">
              <div
                className={`password-strength ${getStrengthColor(
                  passwordScoreDisplay
                )} mb-1`}
              >
                Strength: {getStrengthLabel(passwordScoreDisplay)}
              </div>
              {passwordFeedbackListDisplay.length > 0 && (
                <ul className="password-feedback-list mb-0">
                  {passwordFeedbackListDisplay.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            id="notificationsCheck"
            className="form-check-input"
            checked={wantsNotifications}
            onChange={(e) => setWantsNotifications(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="notificationsCheck">
            Receive email notifications
          </label>
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Signup
        </button>
        <GoogleAuthButton type="button" />
        <div className="links-container mt-3 text-center">
          <p>
            Already part of the app? <Link to="/login">Login</Link>
          </p>
        </div>
      </form>
    </>
  );
};

export default SignupForm;
