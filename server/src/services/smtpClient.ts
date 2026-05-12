// ============================================================
// SMTP helper — Gmail transport + credential normalization
// ============================================================
import nodemailer from 'nodemailer';

type GmailAuth = {
  user: string;
  pass: string;
};

function normalizeSmtpPass(value?: string): string {
  if (!value) return '';
  // Gmail app passwords are commonly copied with spaces; strip whitespace.
  return value.replace(/\s+/g, '');
}

export function getGmailAuth(): GmailAuth {
  const user = (process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '';
  const pass = normalizeSmtpPass(rawPass);

  if (!user || !pass) {
    throw new Error('GMAIL_USER/GMAIL_PASS are not configured for SMTP.');
  }

  return { user, pass };
}

export function createGmailTransporter() {
  const auth = getGmailAuth();
  return nodemailer.createTransport({
    service: 'gmail',
    auth,
  });
}

export function getGmailFromAddress(): string {
  const user = (process.env.GMAIL_USER || '').trim();
  return user ? `"Ermel Glass & Aluminum" <${user}>` : '"Ermel Glass & Aluminum"';
}
