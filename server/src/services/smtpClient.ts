// ============================================================
// Email helper — Brevo/Resend API + Gmail SMTP fallback
// ============================================================
import nodemailer from 'nodemailer';

type EmailAttachment = {
  filename: string;
  content: string;
  contentType?: string;
};

type EmailSendOptions = {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

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

export function getGmailFromAddress(userOverride?: string): string {
  const user = (userOverride || process.env.GMAIL_USER || '').trim();
  return user ? `"Ermel Glass & Aluminum" <${user}>` : '"Ermel Glass & Aluminum"';
}
async function sendWithResend(options: EmailSendOptions): Promise<void> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim();

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured for email delivery.');
  }

  if (!from) {
    throw new Error('EMAIL_FROM is required when RESEND_API_KEY is set.');
  }

  const payload: Record<string, unknown> = {
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  if (options.attachments && options.attachments.length > 0) {
    payload.attachments = options.attachments.map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.from(attachment.content).toString('base64'),
      content_type: attachment.contentType,
    }));
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend API error: ${res.status} ${errorText}`);
  }
}

type ParsedFrom = {
  name: string;
  email: string;
};

function parseFromAddress(value: string): ParsedFrom {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '') || match[2].trim();
    return { name, email: match[2].trim() };
  }

  return { name: trimmed, email: trimmed };
}

async function sendWithBrevo(options: EmailSendOptions): Promise<void> {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const fromRaw = (process.env.EMAIL_FROM || '').trim();

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured for email delivery.');
  }

  if (!fromRaw) {
    throw new Error('EMAIL_FROM is required when BREVO_API_KEY is set.');
  }

  const sender = parseFromAddress(fromRaw);
  const payload: Record<string, unknown> = {
    sender: {
      name: sender.name,
      email: sender.email,
    },
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html,
  };

  if (options.attachments && options.attachments.length > 0) {
    payload.attachment = options.attachments.map((attachment) => ({
      name: attachment.filename,
      content: Buffer.from(attachment.content).toString('base64'),
    }));
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Brevo API error: ${res.status} ${errorText}`);
  }
}

export async function sendTransactionalEmail(options: EmailSendOptions): Promise<void> {
  if ((process.env.BREVO_API_KEY || '').trim()) {
    await sendWithBrevo(options);
    return;
  }

  if ((process.env.RESEND_API_KEY || '').trim()) {
    await sendWithResend(options);
    return;
  }

  const transporter = createGmailTransporter();
  await transporter.sendMail({
    from: getGmailFromAddress(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments?.length
      ? options.attachments.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        }))
      : undefined,
  });
}
