import ForgotPasswordForm from "../../components/ForgotPasswordForm/ForgotPasswordForm";

function ForgotPasswordPage() {
  async function handleForgotPassword(email: string) {
    const response = await fetch(
      "http://localhost:3000/api/user/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

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
