// ============================================================
// Email service — Gmail SMTP via Nodemailer
// ============================================================
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendVerificationEmail(
  to: string,
  fullName: string,
  token: string,
): Promise<void> {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1f2937;">
      <div style="background: #15263c; border-radius: 10px 10px 0 0; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 0.06em; text-transform: uppercase;">ERMEL GLASS &amp; ALUMINUM WORKS</h1>
        <p style="margin: 8px 0 0; color: #cdd8e5; font-size: 13px;">Quality Craftsmanship in Every Detail</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 10px 10px; padding: 24px 28px;">
        <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.7;">Hello ${fullName},</p>
        <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.7;">Welcome to Ermel Glass &amp; Aluminum Works! We are excited to have you on board.</p>
        <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7;">To protect your security and activate your access to our online quotation and project tracking system, please verify your email address by clicking the link below:</p>

        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700;">Verify My Account:</p>
        <p style="margin: 0 0 18px; word-break: break-all;"><a href="${verifyUrl}" style="color: #7a0000;">${verifyUrl}</a></p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700;">Important Details:</p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.6;">- Expiration: This link will expire in 24 hours for your security.</p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.6;">- Security: If you did not create an account with us, please ignore this email; no further action is required.</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6;">- Next Steps: Once verified, you can immediately begin requesting quotations and uploading project photos.</p>
        </div>

        <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7;">Thank you for choosing Ermel!</p>
        <p style="margin: 0 0 2px; font-size: 15px;">Best regards,</p>
        <p style="margin: 0 0 12px; font-size: 15px;">The Ermel Team</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">Ermel Glass &amp; Aluminum Works | Manila, Philippines</p>
        <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px; line-height: 1.6;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Ermel Glass & Aluminum" <${process.env.GMAIL_USER}>`,
    to,
    subject: '🛡️ Action Required: Verify your Ermel Glass & Aluminum account',
    html,
  });
}
