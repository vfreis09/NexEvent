import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import "./ProfilePictureUploader.css";

interface Props {
  showNotification: (
    message: string,
    header: string,
    bg: string,
    textColor?: string
  ) => void;
}

const ProfilePictureUploader: React.FC<Props> = ({ showNotification }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useUser();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (!file.type.startsWith("image/")) {
        showNotification(
          "Please select a valid image file.",
          "Validation Error",
          "danger"
        );
        setImageFile(null);
        return;
      }
      if (file.size > 500000) {
        showNotification(
          "Image size must be less than 500KB.",
          "Validation Error",
          "warning"
        );
        setImageFile(null);
        return;
      }

      setImageFile(file);
    }
  };

  const handleUpload = async () => {
    if (!imageFile) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const apiPath = "http://localhost:3000/api/user/profile/upload";

      try {
        const response = await fetch(apiPath, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64Image: base64String }),
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP error! Status: ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            console.error("Raw server error:", errorText);
          }
          throw new Error(errorMessage);
        }

        showNotification(
          "Profile picture updated successfully!",
          "Success",
          "success"
        );

        if (refreshUser) {
          refreshUser();
        }
        setImageFile(null);
      } catch (error) {
        console.error("Upload failed:", error);

        let message =
          error instanceof Error ? error.message : "An unknown error occurred";

        showNotification(
          `Failed to upload picture. Reason: ${message}`,
          "Upload Failed",
          "danger"
        );
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="profile-uploader-container">
      <div className="input-group mb-3">
        <label className="input-group-text" htmlFor="profileImageFile">
          Browse
        </label>
        <input
          type="file"
          className="form-control"
          id="profileImageFile"
          accept="image/jpeg, image/png"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>
      <div className="uploader-actions">
        <p className="file-status-message">
          {imageFile
            ? `File selected: ${imageFile.name}`
            : "No file selected (Max 500KB, JPEG/PNG)"}
        </p>
        <button
          onClick={handleUpload}
          disabled={!imageFile || loading}
          className={`btn ${
            imageFile ? "btn-success" : "btn-secondary"
          } btn-sm upload-button`}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              Processing...
            </>
          ) : (
            "Save New Picture"
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfilePictureUploader;
