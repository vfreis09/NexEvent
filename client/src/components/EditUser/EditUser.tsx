import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import zxcvbn from "zxcvbn";
import { getPasswordFeedback } from "../../utils/password";
import { useToast } from "../../hooks/useToast";
import AppToast from "../ToastComponent/ToastComponent";
import ProfilePictureUploader from "../ProfilePictureUploader/ProfilePictureUploader";
import { Badge, Form, Spinner } from "react-bootstrap";
import "./EditUser.css";

const DEFAULT_AVATAR_URL = "/images/default-avatar.png";

interface Tag {
  id: number;
  name: string;
}

const EditUser: React.FC = () => {
  const { user, setUser, loadUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { showToast, toastInfo, showNotification, hideToast } = useToast();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedbackList, setPasswordFeedbackList] = useState<string[]>(
    []
  );

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [digestFrequency, setDigestFrequency] = useState("daily");
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setContact(user.contact || "");
      setIsVerified(user.is_verified ?? false);
    }
  }, [user]);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const [tagsRes, settingsRes] = await Promise.all([
          fetch("http://localhost:3000/api/tags"),
          fetch("http://localhost:3000/api/user/settings/all", {
            credentials: "include",
          }),
        ]);

        if (!tagsRes.ok || !settingsRes.ok) throw new Error("Fetch failed");

        const tagsData = await tagsRes.json();
        const settingsData = await settingsRes.json();

        if (Array.isArray(tagsData)) {
          setAvailableTags(tagsData);
        } else if (tagsData && Array.isArray(tagsData.tags)) {
          setAvailableTags(tagsData.tags);
        }

        setDigestFrequency(settingsData.digest_frequency || "daily");
        if (
          settingsData.selected_tags &&
          Array.isArray(settingsData.selected_tags)
        ) {
          setSelectedTagIds(
            settingsData.selected_tags.map((t: any) =>
              typeof t === "object" ? t.id : t
            )
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

  useEffect(() => {
    if (newPassword) {
      const result = zxcvbn(newPassword);
      setPasswordScore(result.score);
      setPasswordFeedbackList(getPasswordFeedback(newPassword));
    } else {
      setPasswordScore(0);
      setPasswordFeedbackList([]);
    }
  }, [newPassword]);

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:3000/api/user/${user?.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, username, bio, contact }),
        }
      );
      if (!response.ok) throw new Error("Update failed");
      const updatedUser = await response.json();
      setUser({ ...user, ...updatedUser });
      showNotification("Profile updated!", "Success", "success");
    } catch (error) {
      showNotification("Update failed.", "Error", "danger");
    }
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/user/settings/update",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            digest_frequency: digestFrequency,
            tagIds: selectedTagIds,
          }),
        }
      );
      if (!response.ok) throw new Error();
      showNotification("Interests updated!", "Success", "success");
      await loadUser();
    } catch (error) {
      showNotification("Failed to save.", "Error", "danger");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    try {
      await fetch("http://localhost:3000/api/user/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme_preference: newTheme }),
      });
      toggleTheme();
    } catch (error) {
      showNotification("Theme update failed.", "Error", "danger");
    }
  };

  const handleSendVerificationEmail = async () => {
    setVerifyMessage(null);
    try {
      await fetch("http://localhost:3000/api/send-verification-email", {
        method: "POST",
        credentials: "include",
      });
      setVerifyMessage("Email sent!");
    } catch (error) {
      setVerifyMessage("Failed to send.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification("Passwords do not match.", "Error", "danger");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:3000/api/user/change-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );
      if (!response.ok) throw new Error();
      showNotification("Password changed!", "Success", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showNotification("Password change failed.", "Error", "danger");
    }
  };

  const getStrengthColor = (score: number) => {
    const colors = [
      "text-danger",
      "text-warning",
      "text-warning",
      "text-success",
      "text-success",
    ];
    return colors[score] || "text-muted";
  };

  if (!user)
    return (
      <div className="text-center mt-5">
        <h2>Please login</h2>
        <Link to="/login" className="btn btn-primary mt-3">
          Login
        </Link>
      </div>
    );

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

      <div className="container edit-user-container pb-5">
        <div
          className={`alert ${
            isVerified ? "alert-success" : "alert-danger"
          } mt-4 d-flex justify-content-between align-items-center`}
        >
          <span>{isVerified ? "Email Verified" : "Email Not Verified"}</span>
          {!isVerified && (
            <button
              onClick={handleSendVerificationEmail}
              className="btn btn-dark btn-sm"
            >
              Resend Link
            </button>
          )}
        </div>
        {verifyMessage && (
          <p className="text-center small mt-1">{verifyMessage}</p>
        )}
        <div className="card p-4 shadow-sm mb-4">
          <h4 className="mb-4">Profile Picture</h4>
          <div className="text-center mb-4">
            <img
              src={user.profile_picture_base64 || DEFAULT_AVATAR_URL}
              className="rounded-circle border"
              style={{ width: "120px", height: "120px", objectFit: "cover" }}
              alt="Profile"
            />
          </div>
          <ProfilePictureUploader showNotification={showNotification} />
        </div>
        <div className="card p-4 shadow-sm mb-4">
          <h4 className="mb-3">Interests & Ranking</h4>
          {loadingPrefs ? (
            <div className="text-center p-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="form-label fw-bold">
                  Email Digest Frequency
                </label>
                <Form.Select
                  className="w-50"
                  value={digestFrequency}
                  onChange={(e) => setDigestFrequency(e.target.value)}
                >
                  <option value="daily">Daily Recap</option>
                  <option value="weekly">Weekly Roundup</option>
                  <option value="never">Unsubscribe</option>
                </Form.Select>
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold d-block">
                  Interest Tags
                </label>
                <div className="d-flex flex-wrap gap-2">
                  {availableTags.length > 0 ? (
                    availableTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        pill
                        bg={
                          selectedTagIds.includes(tag.id) ? "primary" : "light"
                        }
                        text={
                          selectedTagIds.includes(tag.id) ? "white" : "dark"
                        }
                        className="tag-pill border"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted small">No tags found.</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="btn btn-primary w-100 py-2"
              >
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </button>
            </>
          )}
        </div>
        <form onSubmit={handleUserUpdate} className="card p-4 shadow-sm mb-4">
          <h4 className="mb-3">Account Details</h4>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Contact / Phone</label>
              <input
                type="text"
                className="form-control"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Bio</label>
              <textarea
                className="form-control"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-outline-primary w-100 mt-4">
            Update Profile Info
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
              onChange={handleThemeToggle}
            />
            <label className="form-check-label" htmlFor="themeSwitch">
              Dark Mode
            </label>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="card p-4 shadow-sm">
          <h4 className="mb-3">Security</h4>
          {!user.oauth_provider && (
            <div className="mb-3">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                title="old-password"
                name="old-password"
                className="form-control"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              title="new-password"
              name="new-password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            {newPassword && (
              <div className="mt-2">
                <div
                  className={`small fw-bold ${getStrengthColor(passwordScore)}`}
                >
                  Strength: {passwordScore}/4
                </div>
                {passwordFeedbackList.map((f, i) => (
                  <div key={i} className="small text-danger">
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              title="confirm-password"
              name="confirm-password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-secondary w-100">
            Update Password
          </button>
        </form>
      </div>
    </>
  );
};

export default EditUser;
