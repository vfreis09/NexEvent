import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const jwtSecret = process.env.JWT_SECRET as string | undefined;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not defined. Check your environment variables."
  );
}

const mailtrapClient = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, userId: string) => {
  try {
    const token = jwt.sign({ userId }, jwtSecret, { expiresIn: "1h" });
    const verificationLink = `http://localhost:5173/verify-email?token=${token}`;

    const msg = {
      to: email,
      from: "no-reply@yourdomain.com",
      subject: "Verify Your Email",
      text: `Click the link to verify your email: ${verificationLink}`,
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
    };

    await mailtrapClient.sendMail(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email.");
  }
};
