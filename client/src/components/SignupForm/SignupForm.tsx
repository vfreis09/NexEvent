import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import zxcvbn from "zxcvbn";
import { useUser } from "../../context/UserContext";
import { getPasswordFeedback } from "../../utils/password";
import { useToast } from "../../hooks/useToast";
import { useTheme } from "../../context/ThemeContext";
import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import "./SignupForm.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

interface SignupFormData {
  email: string;
  username: string;
  password: string;
  wantsNotifications: boolean;
}

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

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { loadUser, isLoggedIn } = useUser();
  const { showNotification } = useToast();
  useTheme();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    defaultValues: { wantsNotifications: false },
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });
  const passwordScore = password ? zxcvbn(password).score : 0;
  const passwordFeedback = getPasswordFeedback(password);

  useEffect(() => {
    if (isLoggedIn) navigate("/", { replace: true });
  }, [isLoggedIn, navigate]);

  const onSubmit = async (data: SignupFormData) => {
    if (zxcvbn(data.password).score < 2) {
      setError("password", { message: "Please choose a stronger password." });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      await loadUser();

      showNotification("Account created! Redirecting...", "Success", "success");

      setTimeout(() => {
        navigate("/", {
          replace: true,
          state: {
            successMessage:
              "Account created! Please check your email to verify your account.",
          },
        });
      }, 1500);
    } catch (error: any) {
      setError("root", { message: error.message || "Signup failed" });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
        <h1 className="text-center mb-4">Register</h1>

        {errors.root && (
          <div className="error-message mb-3">{errors.root.message}</div>
        )}
        <div className="mb-3">
          <input
            placeholder="Email"
            type="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <div className="invalid-feedback">{errors.email.message}</div>
          )}
        </div>
        <div className="mb-3">
          <input
            placeholder="Username"
            type="text"
            className={`form-control ${errors.username ? "is-invalid" : ""}`}
            {...register("username", { required: "Username is required" })}
          />
          {errors.username && (
            <div className="invalid-feedback">{errors.username.message}</div>
          )}
        </div>
        <div className="mb-3">
          <input
            placeholder="Password"
            type="password"
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password.message}</div>
          )}
          {password && (
            <div className="password-feedback mt-2 mb-3">
              <div
                className={`password-strength ${getStrengthColor(passwordScore)} mb-1`}
              >
                Strength: {getStrengthLabel(passwordScore)}
              </div>
              {passwordFeedback.length > 0 && (
                <ul className="password-feedback-list mb-0">
                  {passwordFeedback.map((item, idx) => (
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
            {...register("wantsNotifications")}
          />
          <label className="form-check-label" htmlFor="notificationsCheck">
            Receive email notifications
          </label>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Signup"}
        </button>
        <GoogleAuthButton />
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
