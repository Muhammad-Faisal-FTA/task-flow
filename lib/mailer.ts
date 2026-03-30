// lib/mailer.ts

import nodemailer, { Transporter } from "nodemailer";

// ─── Validate env vars ────────────────────────────────────────────────────────
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  APP_URL,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !APP_URL) {
  throw new Error(
    "Missing mailer env vars in .env.local:\n" +
    "SMTP_HOST=\nSMTP_PORT=\nSMTP_USER=\nSMTP_PASS=\nSMTP_FROM=\nAPP_URL="
  );
}

// ─── Singleton transporter ────────────────────────────────────────────────────
// Same pattern as mongoose.ts — reuse across hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var _mailerTransporter: Transporter | undefined;
}

function getTransporter(): Transporter {
  if (global._mailerTransporter) return global._mailerTransporter;

  global._mailerTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for port 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Timeout settings — don't hang forever (performance NFR)
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  return global._mailerTransporter;
}

// ─── Base send helper ─────────────────────────────────────────────────────────
interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendMail(options: MailOptions): Promise<void> {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"TaskFlow" <${SMTP_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

// ─── Email Templates ──────────────────────────────────────────────────────────
// Inline styles only — email clients strip <style> blocks

function baseTemplate(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      background-color: #071A2E;
      font-family: Roboto, Arial, sans-serif;
    ">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#071A2E; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:480px; background-color:#0D3A6B; border-radius:16px; overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="
                  background-color:#0A2744;
                  padding: 28px 32px;
                  border-bottom: 1px solid #1565A8;
                ">
                  <h1 style="
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                    color: #FFFFFF;
                    letter-spacing: -0.3px;
                  ">
                    ✓ TaskFlow
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  ${body}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  padding: 20px 32px;
                  border-top: 1px solid #1565A8;
                  background-color:#0A2744;
                ">
                  <p style="
                    margin: 0;
                    font-size: 12px;
                    color: #90A4AE;
                    text-align: center;
                  ">
                    This email was sent by TaskFlow. If you didn't request this, ignore it safely.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── CTA Button helper ────────────────────────────────────────────────────────
function ctaButton(href: string, label: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td align="center">
          
            href="${href}"
            style="
              display: inline-block;
              background-color: #1565A8;
              color: #FFFFFF;
              font-size: 15px;
              font-weight: 600;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 10px;
              letter-spacing: 0.3px;
            "
          >
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ─── Send: Email Verification ─────────────────────────────────────────────────
export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  const body = `
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #FFFFFF; font-weight: 600;">
      Verify your email
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: #B0C4DE; line-height: 1.6;">
      Hi ${name}, thanks for signing up! Click the button below to verify
      your email address and activate your account.
    </p>

    ${ctaButton(verifyUrl, "Verify Email")}

    <p style="margin: 20px 0 0; font-size: 13px; color: #546E7A; line-height: 1.5;">
      Or copy and paste this link into your browser:<br/>
      <span style="color: #29B6F6; word-break: break-all;">${verifyUrl}</span>
    </p>
    <p style="margin: 16px 0 0; font-size: 13px; color: #546E7A;">
      This link expires in <strong style="color:#B0C4DE;">24 hours</strong>.
    </p>
  `;

  await sendMail({
    to,
    subject: "Verify your TaskFlow email address",
    html: baseTemplate("Verify your email — TaskFlow", body),
  });
}

// ─── Send: Password Reset ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const body = `
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #FFFFFF; font-weight: 600;">
      Reset your password
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: #B0C4DE; line-height: 1.6;">
      Hi ${name}, we received a request to reset your TaskFlow password.
      Click the button below to choose a new one.
    </p>

    ${ctaButton(resetUrl, "Reset Password")}

    <p style="margin: 20px 0 0; font-size: 13px; color: #546E7A; line-height: 1.5;">
      Or copy and paste this link into your browser:<br/>
      <span style="color: #29B6F6; word-break: break-all;">${resetUrl}</span>
    </p>
    <p style="margin: 16px 0 0; font-size: 13px; color: #546E7A;">
      This link expires in <strong style="color:#B0C4DE;">1 hour</strong>.
      If you didn't request a reset, you can safely ignore this email.
    </p>
  `;

  await sendMail({
    to,
    subject: "Reset your TaskFlow password",
    html: baseTemplate("Reset your password — TaskFlow", body),
  });
}