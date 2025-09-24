export function isStrongPassword(password: string): boolean {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar
  );
}

export function getPasswordFeedback(password: string): string[] {
  const feedback: string[] = [];
  if (password.length < 8) feedback.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) feedback.push("an uppercase letter");
  if (!/[a-z]/.test(password)) feedback.push("a lowercase letter");
  if (!/\d/.test(password)) feedback.push("a number");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    feedback.push("a special character");
  return feedback;
}
