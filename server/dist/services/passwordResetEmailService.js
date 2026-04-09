"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// ============================================================
// Password reset email service — Gmail SMTP via Nodemailer
// ============================================================
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS,
    },
});
async function sendPasswordResetEmail(to, fullName, token) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1f2937;">
      <div style="background: #15263c; border-radius: 10px 10px 0 0; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 0.06em; text-transform: uppercase;">ERMEL GLASS &amp; ALUMINUM WORKS</h1>
        <p style="margin: 8px 0 0; color: #cdd8e5; font-size: 13px;">Password Reset Request</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 10px 10px; padding: 24px 28px;">
        <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.7;">Hello ${fullName || 'Customer'},</p>
        <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.7;">We received a request to reset your account password.</p>
        <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7;">Use the secure link below to set a new password. This link is valid for 1 hour and can only be used once.</p>

        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700;">Reset Password:</p>
        <p style="margin: 0 0 18px; word-break: break-all;"><a href="${resetUrl}" style="color: #7a0000;">${resetUrl}</a></p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.6;">- This reset link expires in 1 hour.</p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.6;">- The link is single-use for your security.</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6;">- If you did not request this, you can ignore this email safely.</p>
        </div>

        <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7;">Thank you,<br/>Ermel Glass &amp; Aluminum Works</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;
    await transporter.sendMail({
        from: `"Ermel Glass & Aluminum" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'Password reset instructions for your Ermel account',
        html,
    });
}
//# sourceMappingURL=passwordResetEmailService.js.map