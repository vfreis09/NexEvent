import React, { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import zxcvbn from "zxcvbn";
import { getPasswordFeedback } from "../../utils/password";
import { useToast } from "../../hooks/useToast";
import ProfilePictureUploader from "../ProfilePictureUploader/ProfilePictureUploader";
import Loading from "../../components/Loading/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tag {
  id: number;
  name: string;
}

interface AccountFormData {
  username: string;
  email: string;
  bio: string;
  contact: string;
}

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const DEFAULT_AVATAR_URL = "/images/default-avatar.png";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `${rawUrl}/api` : "http://localhost:3000/api";

const EditUser: React.FC = () => {
  const { user, setUser, loadUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { showNotification } = useToast();

  const [isVerified, setIsVerified] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [digestFrequency, setDigestFrequency] = useState("daily");
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    setValue: setAccountValue,
    formState: { errors: accountErrors, isSubmitting: isAccountSubmitting },
  } = useForm<AccountFormData>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    setError: setPasswordError,
    control: passwordControl,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormData>();

  const newPassword = useWatch({
    control: passwordControl,
    name: "newPassword",
    defaultValue: "",
  });
  const passwordScore = newPassword ? zxcvbn(newPassword).score : 0;
  const passwordFeedbackList = getPasswordFeedback(newPassword);

  useEffect(() => {
    if (user) {
      setAccountValue("email", user.email || "");
      setAccountValue("username", user.username || "");
      setAccountValue("bio", user.bio || "");
      setAccountValue("contact", user.contact || "");
      setIsVerified(user.is_verified ?? false);
    }
  }, [user, setAccountValue]);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const [tagsRes, settingsRes] = await Promise.all([
          fetch(`${BASE_URL}/tags`),
          fetch(`${BASE_URL}/user/settings/all`, { credentials: "include" }),
        ]);
        const tagsData = await tagsRes.json();
        const settingsData = await settingsRes.json();
        setAvailableTags(
          Array.isArray(tagsData) ? tagsData : tagsData.tags || [],
        );
        setDigestFrequency(settingsData.digest_frequency || "daily");
        if (settingsData.selected_tags) {
          setSelectedTagIds(
            settingsData.selected_tags.map((t: any) =>
              typeof t === "object" ? t.id : t,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load preferences", error);
      } finally {
        setLoadingPrefs(false);
      }
    };
    fetchPrefs();
  }, []);

  const onAccountSubmit = async (data: AccountFormData) => {
    try {
      const response = await fetch(`${BASE_URL}/user/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error();
      const updatedUser = await response.json();
      setUser({ ...user, ...updatedUser });
      showNotification("Profile updated!", "Success", "success");
    } catch {
      showNotification("Update failed.", "Error", "danger");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError("confirmPassword", {
        message: "Passwords do not match.",
      });
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/user/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!response.ok) throw new Error();
      showNotification("Password changed!", "Success", "success");
      resetPassword();
    } catch {
      showNotification("Password change failed.", "Error", "danger");
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await fetch(`${BASE_URL}/user/settings/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          digest_frequency: digestFrequency,
          tagIds: selectedTagIds,
        }),
      });
      showNotification("Interests updated!", "Success", "success");
      await loadUser();
    } catch {
      showNotification("Failed to save.", "Error", "danger");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div
        className={`mt-6 flex items-center justify-between rounded px-4 py-3 text-sm font-medium ${
          isVerified
            ? "bg-primary/10 text-primary"
            : "bg-destructive/10 text-destructive"
        }`}
      >
        <span>{isVerified ? "Email verified" : "Email not verified"}</span>
      </div>

      <div className="mt-4 rounded border border-border bg-card p-6 text-center">
        <h4 className="mb-4 text-base font-medium text-card-foreground">
          Profile picture
        </h4>
        <div className="flex flex-col items-center gap-3">
          <div
            className="group relative size-24 cursor-pointer overflow-hidden rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src={user.profile_picture_base64 || DEFAULT_AVATAR_URL}
              className="size-full object-cover"
              alt="Profile"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-xs font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
              Change photo
            </div>
          </div>
          <ProfilePictureUploader
            inputRef={fileInputRef}
            showNotification={showNotification}
          />
        </div>
      </div>

      <div className="mt-4 rounded border border-border bg-card p-6">
        <h4 className="mb-3 text-base font-medium text-card-foreground">
          Interests
        </h4>
        {loadingPrefs ? (
          <Loading variant="spinner" text="Loading preferences..." />
        ) : (
          <>
            <div className="mb-6">
              <Label className="mb-2 block font-medium">
                Email digest frequency
              </Label>
              <Select
                value={digestFrequency}
                onValueChange={(value) => {
                  if (value) setDigestFrequency(value);
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily recap</SelectItem>
                  <SelectItem value="weekly">Weekly roundup</SelectItem>
                  <SelectItem value="never">Unsubscribe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6">
              <Label className="mb-2 block font-medium">Interest tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer rounded-full"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id],
                        )
                      }
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="w-full"
            >
              {savingPrefs ? "Saving..." : "Save preferences"}
            </Button>
          </>
        )}
      </div>

      <form
        onSubmit={handleAccountSubmit(onAccountSubmit)}
        className="mt-4 rounded border border-border bg-card p-6"
      >
        <h4 className="mb-3 text-base font-medium text-card-foreground">
          Account details
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="username" className="mb-1.5 block">
              Username
            </Label>
            <Input
              id="username"
              aria-invalid={!!accountErrors.username}
              {...registerAccount("username")}
            />
            {accountErrors.username && (
              <p className="mt-1 text-xs text-destructive">
                {accountErrors.username.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="mb-1.5 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              aria-invalid={!!accountErrors.email}
              {...registerAccount("email", { required: "Email is required" })}
            />
            {accountErrors.email && (
              <p className="mt-1 text-xs text-destructive">
                {accountErrors.email.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio" className="mb-1.5 block">
              Bio
            </Label>
            <Textarea id="bio" rows={2} {...registerAccount("bio")} />
          </div>
        </div>
        <Button
          type="submit"
          className="mt-6 w-full"
          disabled={isAccountSubmitting}
        >
          {isAccountSubmitting ? "Updating..." : "Update profile info"}
        </Button>
      </form>

      <div className="mt-4 rounded border border-border bg-card p-6">
        <h4 className="mb-3 text-base font-medium text-card-foreground">
          Appearance
        </h4>
        <div className="flex items-center gap-3">
          <Switch
            id="theme-switch"
            checked={theme === "dark"}
            onCheckedChange={toggleTheme}
          />
          <Label htmlFor="theme-switch">Dark mode</Label>
        </div>
      </div>

      <form
        onSubmit={handlePasswordSubmit(onPasswordSubmit)}
        className="mt-4 rounded border border-border bg-card p-6"
      >
        <h4 className="mb-3 text-base font-medium text-card-foreground">
          Security
        </h4>
        <div className="mb-4">
          <Label htmlFor="oldPassword" className="mb-1.5 block">
            Old password
          </Label>
          <Input
            id="oldPassword"
            type="password"
            aria-invalid={!!passwordErrors.oldPassword}
            {...registerPassword("oldPassword", {
              required: "Old password is required",
            })}
          />
          {passwordErrors.oldPassword && (
            <p className="mt-1 text-xs text-destructive">
              {passwordErrors.oldPassword.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <Label htmlFor="newPassword" className="mb-1.5 block">
            New password
          </Label>
          <Input
            id="newPassword"
            type="password"
            aria-invalid={!!passwordErrors.newPassword}
            {...registerPassword("newPassword", {
              required: "New password is required",
            })}
          />
          {passwordErrors.newPassword && (
            <p className="mt-1 text-xs text-destructive">
              {passwordErrors.newPassword.message}
            </p>
          )}
          {newPassword && (
            <div className="mt-2">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${
                    passwordScore < 3 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${(passwordScore + 1) * 20}%` }}
                />
              </div>
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {passwordFeedbackList.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-6">
          <Label htmlFor="confirmPassword" className="mb-1.5 block">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            aria-invalid={!!passwordErrors.confirmPassword}
            {...registerPassword("confirmPassword", {
              required: "Please confirm your password",
            })}
          />
          {passwordErrors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">
              {passwordErrors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={isPasswordSubmitting}
        >
          {isPasswordSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
};

export default EditUser;