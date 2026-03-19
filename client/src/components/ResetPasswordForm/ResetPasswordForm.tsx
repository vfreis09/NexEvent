import { useForm, useWatch } from "react-hook-form";
import zxcvbn from "zxcvbn";
import { getPasswordFeedback, isStrongPassword } from "../../utils/password";
import "./ResetPasswordForm.css";

interface ResetPasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
}

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const getStrengthLabel = (score: number) => {
  switch (score) {
    case 0:
      return "Very Weak";
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "";
  }
};

const getStrengthColor = (score: number) => {
  switch (score) {
    case 0:
      return "red";
    case 1:
      return "orangered";
    case 2:
      return "orange";
    case 3:
      return "yellowgreen";
    case 4:
      return "green";
    default:
      return "gray";
  }
};

function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ResetPasswordFormData>();

  const password = useWatch({ control, name: "password", defaultValue: "" });
  const passwordScore = password ? zxcvbn(password).score : 0;
  const passwordFeedbackList = getPasswordFeedback(password);

  const onFormSubmit = async (data: ResetPasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", { message: "Passwords do not match." });
      return;
    }

    if (!isStrongPassword(data.password)) {
      setError("password", {
        message: "Please fix your password according to the criteria below.",
      });
      return;
    }

    try {
      await onSubmit(data.password.trim());
      reset();
    } catch (err: any) {
      setError("root", { message: err.message || "Something went wrong." });
    }
  };

  return (
    <div className="reset-password-container d-flex justify-content-center align-items-center">
      <form
        className="card reset-password-card shadow-sm d-flex flex-column"
        onSubmit={handleSubmit(onFormSubmit)}
      >
        <h3 className="mb-4 text-center">Reset Password</h3>
        <input
          type="password"
          className={`form-control mb-2 ${errors.password ? "is-invalid" : ""}`}
          placeholder="New Password"
          disabled={isSubmitting}
          {...register("password", { required: "Password is required." })}
        />
        {errors.password && (
          <div className="invalid-feedback d-block mb-2">
            {errors.password.message}
          </div>
        )}
        {password && (
          <div className="password-feedback mb-3">
            <div style={{ color: getStrengthColor(passwordScore) }}>
              Strength: {getStrengthLabel(passwordScore)}
            </div>
            {passwordFeedbackList.length > 0 && (
              <ul
                className="mb-0 mt-1"
                style={{ color: "red", paddingLeft: "18px" }}
              >
                {passwordFeedbackList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <input
          type="password"
          className={`form-control mb-3 ${errors.confirmPassword ? "is-invalid" : ""}`}
          placeholder="Confirm Password"
          disabled={isSubmitting}
          {...register("confirmPassword", {
            required: "Please confirm your password.",
          })}
        />
        {errors.confirmPassword && (
          <div className="invalid-feedback d-block mb-2">
            {errors.confirmPassword.message}
          </div>
        )}
        {isSubmitSuccessful && !errors.root && (
          <p className="text-success mt-2">Password reset successfully!</p>
        )}
        {errors.root && (
          <p className="text-danger mt-2">{errors.root.message}</p>
        )}
        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
