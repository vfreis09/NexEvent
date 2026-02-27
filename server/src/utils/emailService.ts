import { BrevoClient } from "@getbrevo/brevo";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const jwtSecret = process.env.JWT_SECRET as string | undefined;
if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not defined. Check your environment variables.",
  );
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY as string });

const FROM_EMAIL = "a39336001@smtp-brevo.com";
const FROM_NAME = "NexEvent";

const sendEmail = async (to: string, subject: string, message: string) => {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      to: [{ email: to }],
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      htmlContent: message,
      textContent: message.replace(/<[^>]+>/g, ""),
    });
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw new Error("Failed to send email.");
  }
};

const sendVerificationEmail = async (email: string, userId: string) => {
  try {
    const token = jwt.sign({ userId }, jwtSecret as string, {
      expiresIn: "1h",
    });
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;
    const message = `
      <h3>Verify Your Email</h3>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link will expire in 1 hour.</p>
    `;
    await sendEmail(email, "Verify Your Email", message);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email.");
  }
};

const sendEventUpdateEmail = async (
  email: string,
  eventName: string,
  eventId: number | string,
) => {
  const eventLink = `${FRONTEND_URL}/event/${eventId}`;
  const subject = `Event Updated: ${eventName}`;
  const message = `
    <h3>Event Updated!</h3>
    <p>The event "<strong>${eventName}</strong>" you RSVP'd to has been updated.</p>
    <p>Please click below to see the changes:</p>
    <a href="${eventLink}">${eventLink}</a>
    <p>We recommend checking the new event time or location if applicable.</p>
  `;
  await sendEmail(email, subject, message);
};

const sendEventCancelationEmail = async (
  email: string,
  eventName: string,
  eventId: string,
) => {
  const eventLink = `${FRONTEND_URL}/event/${eventId}`;
  const subject = `Event Canceled: ${eventName}`;
  const message = `
    <h3>Event Canceled</h3>
    <p>We're sorry to inform you that the event "<strong>${eventName}</strong>" has been canceled.</p>
    <p>You can check the event details here:</p>
    <a href="${eventLink}">${eventLink}</a>
  `;
  await sendEmail(email, subject, message);
};

const sendInviteEmail = async (
  email: string,
  eventName: string,
  eventId: number,
) => {
  const eventLink = `${FRONTEND_URL}/event/${eventId}`;
  const subject = `You're Invited to: ${eventName}`;
  const message = `
    <h3>You've Been Invited</h3>
    <p>You have been invited to join the event "<strong>${eventName}</strong>".</p>
    <p>Click below to view and respond to the invite:</p>
    <a href="${eventLink}">${eventLink}</a>
  `;
  await sendEmail(email, subject, message);
};

const emailServices = {
  sendEmail,
  sendVerificationEmail,
  sendEventUpdateEmail,
  sendEventCancelationEmail,
  sendInviteEmail,
};

export default emailServices;
