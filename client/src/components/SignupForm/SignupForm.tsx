import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import "./SignupForm.css";

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const navigate = useNavigate();
  const { loadUser, isLoggedIn } = useUser();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, wantsNotifications }),
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      await loadUser();

      navigate("/", {
        state: {
          successMessage:
            "Account created! Please check your email to verify your account.",
        },
      });
    } catch (error) {
      console.error("Signup failed", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="signup-form">
      <h1>Register</h1>
      <div>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div
        className="form-group mb-3"
        style={{ maxWidth: "300px", width: "100%" }}
      >
        <div className="d-flex align-items-start">
          <input
            type="checkbox"
            id="notificationsCheck"
            className="form-check-input me-2"
            style={{ width: "auto", height: "auto" }}
            checked={wantsNotifications}
            onChange={(e) => setWantsNotifications(e.target.checked)}
          />
          <label
            className="form-check-label mb-0"
            htmlFor="notificationsCheck"
            style={{
              whiteSpace: "normal",
              lineHeight: "1.2",
            }}
          >
            Receive email notifications about events
          </label>
        </div>
      </div>
      <button type="submit">Signup</button>
      <div className="links-container">
        <p>
          Already part of the app? <Link to="/login">Login</Link>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;
