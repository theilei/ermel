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
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #fafafa;">
      <div style="background: #15263c; padding: 24px 32px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; font-size: 22px; margin: 0; letter-spacing: 0.06em; text-transform: uppercase;">
          ERMEL Glass &amp; Aluminum
        </h1>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #15263c; font-size: 20px; margin: 0 0 16px;">
          Verify Your Email Address
        </h2>
        <p style="color: #54667d; font-size: 15px; line-height: 1.6;">
          Hi <strong>${fullName}</strong>,
        </p>
        <p style="color: #54667d; font-size: 15px; line-height: 1.6;">
          Thank you for registering with Ermel. Please click the button below to verify your email address.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #7a0000, #a50000); color: white; font-size: 16px; font-weight: 700; padding: 14px 40px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.06em;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 13px; line-height: 1.5;">
          This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 11px; text-align: center;">
          &copy; ${new Date().getFullYear()} Ermel Glass &amp; Aluminum Works. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Ermel Glass & Aluminum" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Verify your email — Ermel Glass & Aluminum',
    html,
  });
}
