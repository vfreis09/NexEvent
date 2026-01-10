import React, { useState, useEffect, useRef } from "react";
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const tagsData = await tagsRes.json();
        const settingsData = await settingsRes.json();
        setAvailableTags(
          Array.isArray(tagsData) ? tagsData : tagsData.tags || []
        );
        setDigestFrequency(settingsData.digest_frequency || "daily");
        if (settingsData.selected_tags) {
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
      if (!response.ok) throw new Error();
      const updatedUser = await response.json();
      setUser({ ...user, ...updatedUser });
      showNotification("Profile updated!", "Success", "success");
    } catch (error) {
      showNotification("Update failed.", "Error", "danger");
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await fetch("http://localhost:3000/api/user/settings/update", {
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
    } catch (error) {
      showNotification("Failed to save.", "Error", "danger");
    } finally {
      setSavingPrefs(false);
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
        className={`container edit-user-container pb-5 ${
          theme === "dark" ? "dark-mode" : ""
        }`}
      >
        <div
          className={`alert ${
            isVerified ? "alert-success-soft" : "alert-danger-soft"
          } mt-4 d-flex justify-content-between align-items-center`}
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
            <Spinner animation="border" size="sm" />
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
                            : [...prev, tag.id]
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
                {savingPrefs ? <Spinner size="sm" /> : "Save Preferences"}
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
          <button type="submit" className="btn btn-primary w-100 mt-4">
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
              onChange={toggleTheme}
            />
            <label className="form-check-label" htmlFor="themeSwitch">
              Dark Mode
            </label>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="card p-4 shadow-sm">
          <h4 className="mb-3">Security</h4>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            {newPassword && (
              <div className="mt-2">
                <div className="progress" style={{ height: "5px" }}>
                  <div
                    className={`progress-bar bg-${
                      passwordScore < 3 ? "danger" : "success"
                    }`}
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
          <button type="submit" className="btn btn-secondary w-100">
            Update Password
          </button>
        </form>
      </div>
    </>
  );
};

export default EditUser;
