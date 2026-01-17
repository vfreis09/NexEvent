import React, { useState } from "react";
import { useUser } from "../../context/UserContext";

interface Props {
  inputRef: React.RefObject<any>;
  showNotification: (
    message: string,
    header: string,
    bg: string,
    textColor?: string
  ) => void;
}

const ProfilePictureUploader: React.FC<Props> = ({
  inputRef,
  showNotification,
}) => {
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useUser();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (!file.type.startsWith("image/")) {
        showNotification(
          "Please select a valid image file.",
          "Validation Error",
          "danger"
        );
        return;
      }
      if (file.size > 500000) {
        showNotification(
          "Image size must be less than 500KB.",
          "Validation Error",
          "warning"
        );
        return;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const apiPath = "http://localhost:3000/api/user/profile/upload";

      try {
        const response = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image: base64String }),
          credentials: "include",
        });

        if (!response.ok) throw new Error("Server rejected the upload");
        showNotification("Profile picture updated!", "Success", "success");
        if (refreshUser) refreshUser();
      } catch (error) {
        showNotification(
          "Failed to upload picture.",
          "Upload Failed",
          "danger"
        );
      } finally {
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        accept="image/jpeg, image/png"
        onChange={handleFileChange}
        disabled={loading}
      />
      {loading && (
        <div className="mt-2">
          <span className="spinner-border spinner-border-sm text-primary me-2"></span>
          <small className="text-muted">Uploading...</small>
        </div>
      )}
    </>
  );
};

export default ProfilePictureUploader;
