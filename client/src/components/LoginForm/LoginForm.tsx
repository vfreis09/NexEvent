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
      <h1>Login</h1>
      {errors.root && (
        <div className="error-message">{errors.root.message}</div>
      )}
      <div>
        <input
          placeholder="Email"
          type="email"
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>
      <div>
        <input
          placeholder="Password"
          type="password"
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
      <GoogleAuthButton />
      <div className="links-container">
        <Link to="/forgot-password">Forgot your password?</Link>
        <p>
          First time using the app? <Link to="/signup">Signup</Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
