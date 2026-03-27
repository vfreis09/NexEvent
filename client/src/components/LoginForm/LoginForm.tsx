import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import "./LoginForm.css";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { loadUser, isLoggedIn } = useUser();
  useTheme();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError("root", {
          message: errorData.message || "Invalid email or password.",
        });
        return;
      }

      await loadUser();
      navigate("/");
    } catch (error) {
      setError("root", { message: "Login failed. Please try again." });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
      <h1 className="text-center mb-4">Login</h1>
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
          placeholder="Password"
          type="password"
          className={`form-control ${errors.password ? "is-invalid" : ""}`}
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <div className="invalid-feedback">{errors.password.message}</div>
        )}
      </div>
      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
      <GoogleAuthButton />
      <div className="links-container mt-3 text-center">
        <Link to="/forgot-password">Forgot your password?</Link>
        <p>
          First time using the app? <Link to="/signup">Signup</Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
