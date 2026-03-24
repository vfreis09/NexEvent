import React, { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import zxcvbn from "zxcvbn";
import { getPasswordFeedback } from "../../utils/password";
import { useToast } from "../../hooks/useToast";
import AppToast from "../ToastComponent/ToastComponent";
import ProfilePictureUploader from "../ProfilePictureUploader/ProfilePictureUploader";
import { Badge, Form } from "react-bootstrap";
import Loading from "../../components/Loading/Loading";
import "./EditUser.css";

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
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

const EditUser: React.FC = () => {
  const { user, setUser, loadUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { showToast, toastInfo, showNotification, hideToast } = useToast();

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
    <>
      {showToast && toastInfo && (
        <AppToast
          show={showToast}
          message={toastInfo.message}
          header={toastInfo.header}
          bg={toastInfo.bg}
          onClose={hideToast}
        />
      )}
      <div
        className={`container edit-user-container pb-5 ${theme === "dark" ? "dark-mode" : ""}`}
      >
        <div
          className={`alert ${isVerified ? "alert-success-soft" : "alert-danger-soft"} mt-4 d-flex justify-content-between align-items-center`}
        >
          <span>{isVerified ? "Email Verified" : "Email Not Verified"}</span>
        </div>
        <div className="card p-4 shadow-sm mb-4 text-center">
          <h4 className="mb-4">Profile Picture</h4>
          <div className="avatar-edit-wrapper">
            <div
              className="avatar-edit-container"
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={user.profile_picture_base64 || DEFAULT_AVATAR_URL}
                className="rounded-circle avatar-main-img"
                alt="Profile"
              />
              <div className="avatar-overlay">
                <span>Change Photo</span>
              </div>
            </div>
            <ProfilePictureUploader
              inputRef={fileInputRef}
              showNotification={showNotification}
            />
          </div>
        </div>
        <div className="card p-4 shadow-sm mb-4">
          <h4 className="mb-3">Interests</h4>
          {loadingPrefs ? (
            <Loading variant="spinner" text="Loading preferences..." />
          ) : (
            <>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  Email Digest Frequency
                </Form.Label>
                <Form.Select
                  className="w-50"
                  value={digestFrequency}
                  onChange={(e) => setDigestFrequency(e.target.value)}
                >
                  <option value="daily">Daily Recap</option>
                  <option value="weekly">Weekly Roundup</option>
                  <option value="never">Unsubscribe</option>
                </Form.Select>
              </Form.Group>
              <div className="mb-4">
                <Form.Label className="fw-bold d-block">
                  Interest Tags
                </Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      pill
                      bg={selectedTagIds.includes(tag.id) ? "primary" : "light"}
                      className="tag-pill"
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
                  ))}
                </div>
              </div>
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="btn btn-primary w-100"
              >
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </button>
            </>
          )}
        </div>
        <form
          onSubmit={handleAccountSubmit(onAccountSubmit)}
          className="card p-4 shadow-sm mb-4"
        >
          <h4 className="mb-3">Account Details</h4>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Username</label>
              <input
                type="text"
                className={`form-control ${accountErrors.username ? "is-invalid" : ""}`}
                {...registerAccount("username")}
              />
              {accountErrors.username && (
                <div className="invalid-feedback">
                  {accountErrors.username.message}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${accountErrors.email ? "is-invalid" : ""}`}
                {...registerAccount("email", { required: "Email is required" })}
              />
              {accountErrors.email && (
                <div className="invalid-feedback">
                  {accountErrors.email.message}
                </div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label">Bio</label>
              <textarea
                className="form-control"
                rows={2}
                {...registerAccount("bio")}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 mt-4"
            disabled={isAccountSubmitting}
          >
            {isAccountSubmitting ? "Updating..." : "Update Profile Info"}
          </button>
        </form>
        <div className="card p-4 shadow-sm mb-4">
          <h4 className="mb-3">Appearance</h4>
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id="themeSwitch"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <label className="form-check-label" htmlFor="themeSwitch">
              Dark Mode
            </label>
          </div>
        </div>
        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className="card p-4 shadow-sm"
        >
          <h4 className="mb-3">Security</h4>
          <div className="mb-3">
            <label className="form-label">Old Password</label>
            <input
              type="password"
              className={`form-control ${passwordErrors.oldPassword ? "is-invalid" : ""}`}
              {...registerPassword("oldPassword", {
                required: "Old password is required",
              })}
            />
            {passwordErrors.oldPassword && (
              <div className="invalid-feedback">
                {passwordErrors.oldPassword.message}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className={`form-control ${passwordErrors.newPassword ? "is-invalid" : ""}`}
              {...registerPassword("newPassword", {
                required: "New password is required",
              })}
            />
            {passwordErrors.newPassword && (
              <div className="invalid-feedback">
                {passwordErrors.newPassword.message}
              </div>
            )}
            {newPassword && (
              <div className="mt-2">
                <div className="progress" style={{ height: "5px" }}>
                  <div
                    className={`progress-bar bg-${passwordScore < 3 ? "danger" : "success"}`}
                    style={{ width: `${(passwordScore + 1) * 20}%` }}
                  ></div>
                </div>
                <ul className="small text-muted mt-2">
                  {passwordFeedbackList.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className={`form-control ${passwordErrors.confirmPassword ? "is-invalid" : ""}`}
              {...registerPassword("confirmPassword", {
                required: "Please confirm your password",
              })}
            />
            {passwordErrors.confirmPassword && (
              <div className="invalid-feedback">
                {passwordErrors.confirmPassword.message}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-secondary w-100"
            disabled={isPasswordSubmitting}
          >
            {isPasswordSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </>
  );
};

export default EditUser;
