import { useSearchParams } from "react-router-dom";
import ResetPasswordForm from "../../components/ResetPasswordForm/ResetPasswordForm";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  async function handleResetPassword(password: string) {
    if (!token || !id) {
      throw new Error("Invalid or missing reset token.");
    }

    const response = await fetch(
      "http://localhost:3000/api/user/reset-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: id, token, password }),
      }
    );

    if (!response.ok) {
      let message = "Reset password failed";
      const text = await response.text();

      try {
        const data = JSON.parse(text);
        message = data.message || message;
      } catch {
        console.error("Non-JSON error response:", text);
        message = text || message;
      }

      throw new Error(message);
    }
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <ResetPasswordForm onSubmit={handleResetPassword} />
    </div>
  );
}

export default ResetPasswordPage;
