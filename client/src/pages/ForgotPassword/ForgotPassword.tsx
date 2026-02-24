import ForgotPasswordForm from "../../components/ForgotPasswordForm/ForgotPasswordForm";

const rawUrl = import.meta.env.VITE_PUBLIC_API_URL;
const BASE_URL = rawUrl ? `https://${rawUrl}/api` : "http://localhost:3000/api";

function ForgotPasswordPage() {
  async function handleForgotPassword(email: string) {
    const response = await fetch(`${BASE_URL}/user/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }
  }

  return (
    <div>
      <ForgotPasswordForm onSubmit={handleForgotPassword} />
    </div>
  );
}

export default ForgotPasswordPage;
