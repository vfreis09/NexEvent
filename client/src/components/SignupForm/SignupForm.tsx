import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import zxcvbn from "zxcvbn";
import { Eye, EyeOff, Calendar, MapPin, Bell } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { getPasswordFeedback } from "../../utils/password";
import { useToast } from "../../hooks/useToast";
import { useTheme } from "../../context/ThemeContext";
import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

interface SignupFormData {
  email: string;
  username: string;
  password: string;
  wantsNotifications: boolean;
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

const strengthConfig: Record<number, { label: string; className: string }> = {
  0: { label: "Very weak", className: "text-destructive" },
  1: { label: "Weak", className: "text-destructive" },
  2: { label: "Fair", className: "text-yellow-600 dark:text-yellow-500" },
  3: { label: "Good", className: "text-green-600 dark:text-green-500" },
  4: { label: "Strong", className: "text-green-600 dark:text-green-500" },
};

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { loadUser, isLoggedIn } = useUser();
  const { showNotification } = useToast();
  const [showPassword, setShowPassword] = useState(false);
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
  const strength = strengthConfig[passwordScore];

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
          className="w-full max-w-[420px] rounded-xl border border-border bg-card p-9"
        >
          <h1 className="text-center text-2xl font-semibold text-card-foreground">
            Create your account
          </h1>
          <p className="mb-7 mt-1 text-center text-sm text-muted-foreground">
            Start discovering events that fit you
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
            <Label htmlFor="username" className="mb-1.5 block">
              Username
            </Label>
            <Input
              id="username"
              placeholder="janedoe"
              type="text"
              aria-invalid={!!errors.username}
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-destructive">
                {errors.username.message}
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
            {password && (
              <div className="mt-2">
                <p className={cn("text-xs font-medium", strength.className)}>
                  Strength: {strength.label}
                </p>
                {passwordFeedback.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-xs text-destructive">
                    {passwordFeedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="mb-5 flex items-center gap-2">
            <input
              type="checkbox"
              id="notificationsCheck"
              className="h-4 w-4 rounded border-input accent-primary"
              {...register("wantsNotifications")}
            />
            <Label htmlFor="notificationsCheck" className="font-normal">
              Receive email notifications
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Signup"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleAuthButton />

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already part of the app?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;