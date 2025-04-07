import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./VerifyEmail.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying...");
  const navigate = useNavigate();
  const { isLoggedIn, loadUser } = useUser();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/verify-email?token=${token}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();
        if (response.ok) {
          setMessage("Email verified successfully! Redirecting...");

          await loadUser();

          setTimeout(() => {
            navigate(isLoggedIn ? "/" : "/login");
          }, 2000);
        } else {
          setMessage(data.message || "Verification failed.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setMessage("Email verification failed.");
      }
    };

    verifyEmail();
  }, [searchParams, navigate, loadUser, isLoggedIn]);

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card text-center shadow p-4 verify-card">
        <h1 className="mb-3">Email Verification</h1>
        <p className="lead">{message}</p>
        <div
          className="spinner-border text-primary mt-3"
          role="status"
          hidden={!message.includes("Verifying")}
        ></div>
      </div>
    </div>
  );
}

export default VerifyEmail;
