import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Calendar, MapPin, Bell } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

interface LoginFormData {
  email: string;
  password: string;
}

const features = [
  {
    icon: MapPin,
    title: "Discover events near you",
    sub: "Filter by tag, date, or distance",
  },
  {
    icon: Calendar,
    title: "Create in minutes",
    sub: "Set visibility, capacity, and location",
  },
  {
    icon: Bell,
    title: "Stay in the loop",
    sub: "Get notified about events you follow",
  },
];

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { loadUser, isLoggedIn } = useUser();
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-[calc(100vh-72px)]">
      {/* Brand panel */}
      <div className="hidden w-full max-w-[480px] flex-col justify-center border-r border-border bg-muted/30 px-14 py-20 lg:flex">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          NexEvent
        </h2>
        <p className="mb-12 text-sm leading-relaxed text-muted-foreground">
          Find, create, and RSVP to events that fit your interests.
        </p>
        <ul className="flex flex-col gap-7">
          {features.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-[400px] rounded-xl border border-border bg-card p-9"
        >
          <h1 className="text-center text-2xl font-semibold text-card-foreground">
            Welcome back
          </h1>
          <p className="mb-7 mt-1 text-center text-sm text-muted-foreground">
            Log in to manage your events
          </p>

          {errors.root && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive">
              {errors.root.message}
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="email" className="mb-1.5 block">
              Email
            </Label>
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              aria-invalid={!!errors.email}
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="password" className="mb-1.5 block">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="••••••••••"
                type={showPassword ? "text" : "password"}
                aria-invalid={!!errors.password}
                className="pr-10"
                {...register("password", {
                  required: "Password is required",
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="-mt-1 mb-4 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleAuthButton />

          <p className="mt-5 text-center text-sm text-muted-foreground">
            First time using the app?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Signup
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;