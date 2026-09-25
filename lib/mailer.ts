// lib/mailer.ts
import nodemailer, { Transporter } from "nodemailer";
import { buildAppUrl } from "@/lib/emailLinks";

export interface MailerConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  baseUrl: string;
}

export function resolveMailerConfig(env: NodeJS.ProcessEnv = process.env): MailerConfig | null {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS: rawSmtpPass,
    SMTP_FROM,
    APP_URL,
    VERCEL_URL,
  } = env;

  const SMTP_PASS = rawSmtpPass?.replace(/\s/g, "");
  const baseUrl = APP_URL || (VERCEL_URL ? `https://${VERCEL_URL}` : "http://localhost:3000");

  const required = [
    ["SMTP_HOST", SMTP_HOST],
    ["SMTP_PORT", SMTP_PORT],
    ["SMTP_USER", SMTP_USER],
    ["SMTP_PASS", SMTP_PASS],
    ["SMTP_FROM", SMTP_FROM],
  ] as const;

  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0 || !baseUrl) {
    console.error("[mailer] Missing required env vars:", {
      missing,
      baseUrl: !!baseUrl,
    });
    return null;
  }

  return {
    host: SMTP_HOST!,
    port: Number(SMTP_PORT),
    user: SMTP_USER!,
    pass: SMTP_PASS!,
    from: SMTP_FROM!,
    baseUrl,
  };
}

const mailerConfig = resolveMailerConfig();

// ─── Singleton transporter ────────────────────────────────────────────────────
declare global {
  var _mailerTransporter: Transporter | undefined;
}

function getTransporter(): Transporter | null {
  if (!mailerConfig) {
    return null;
  }

  if (global._mailerTransporter) return global._mailerTransporter;

  global._mailerTransporter = nodemailer.createTransport({
    host: mailerConfig.host,
    port: mailerConfig.port,
    secure: mailerConfig.port === 465,
    auth: { user: mailerConfig.user, pass: mailerConfig.pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  return global._mailerTransporter;
}

// ─── Send helper ──────────────────────────────────────────────────────────────
interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendMail(options: MailOptions): Promise<void> {
  const transporter = getTransporter();

  if (!transporter || !mailerConfig) {
    console.error("[mailer] Mail delivery skipped because SMTP env vars are missing.", {
      recipient: options.to,
      subject: options.subject,
    });
    throw new Error("MAILER_NOT_CONFIGURED");
  }

  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${mailerConfig.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error("Email delivery failed", {
      code: error instanceof Error && "code" in error ? error.code : undefined,
      message: error instanceof Error ? error.message : String(error),
      recipient: options.to,
    });
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
}

// ─── Base template ────────────────────────────────────────────────────────────
function baseTemplate(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#071A2E;font-family:Roboto,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#071A2E;padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:480px;background-color:#0D3A6B;border-radius:16px;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background-color:#0A2744;padding:28px 32px;border-bottom:1px solid #1565A8;">
                  <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">
                    ✓ TaskFlow
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  ${body}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;border-top:1px solid #1565A8;background-color:#0A2744;">
                  <p style="margin:0;font-size:12px;color:#90A4AE;text-align:center;">
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

// ─── CTA Button ───────────────────────────────────────────────────────────────
// ↓ FIXED: proper opening <a href="..."> tag — was missing before
function ctaButton(href: string, label: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <a href="${href}" style="
            display:inline-block;
            background-color:#1565A8;
            color:#FFFFFF;
            font-size:15px;
            font-weight:600;
            text-decoration:none;
            padding:14px 32px;
            border-radius:10px;
            letter-spacing:0.3px;
          ">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

// ─── Verification email ───────────────────────────────────────────────────────
export async function sendVerificationEmail(
  to:    string,
  name:  string,
  otp: string
): Promise<void> {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#FFFFFF;font-weight:600;">
      Verify your email
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#B0C4DE;line-height:1.6;">
      Hi ${name}, use this one-time code to activate your account:
    </p>
    <p style="margin:24px 0;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#29B6F6;">
      ${otp}
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#546E7A;">
      This code expires in <strong style="color:#B0C4DE;">10 minutes</strong>.
    </p>
  `;

  await sendMail({
    to,
    subject: "Verify your TaskFlow email address",
    html:    baseTemplate("Verify your email — TaskFlow", body),
  });
}

// ─── Password reset email ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  to:    string,
  name:  string,
  token: string
): Promise<void> {
  const resetUrl = buildAppUrl("/reset-password", { token }, mailerConfig?.baseUrl ?? "http://localhost:3000");

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#FFFFFF;font-weight:600;">
      Reset your password
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#B0C4DE;line-height:1.6;">
      Hi ${name}, we received a request to reset your TaskFlow password.
      Click the button below to choose a new one.
    </p>

    ${ctaButton(resetUrl, "Reset Password")}

    <p style="margin:20px 0 0;font-size:13px;color:#546E7A;line-height:1.5;">
      Or copy and paste this link into your browser:<br/>
      <span style="color:#29B6F6;word-break:break-all;">${resetUrl}</span>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#546E7A;">
      This link expires in <strong style="color:#B0C4DE;">1 hour</strong>.
      If you didn't request a reset, you can safely ignore this email.
    </p>
  `;

  await sendMail({
    to,
    subject: "Reset your TaskFlow password",
    html:    baseTemplate("Reset your password — TaskFlow", body),
  });
}
