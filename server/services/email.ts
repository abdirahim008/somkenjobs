// Transactional email via Resend's REST API (https://resend.com/docs).
// Uses global fetch so no SDK dependency is needed. Requires two env vars:
//   RESEND_API_KEY  - your Resend API key
//   RESEND_FROM     - verified sender, e.g. "Somken Jobs <noreply@somkenjobs.com>"
const RESEND_API_URL = "https://api.resend.com/emails";

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Send the password-reset email. Returns true if the email was dispatched.
 * If RESEND_API_KEY is missing (e.g. local dev), logs the reset URL instead
 * of throwing so the flow stays testable without a provider configured.
 */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Somken Jobs <noreply@somkenjobs.com>";

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping send. Reset URL for ${to}: ${resetUrl}`,
    );
    return false;
  }

  const safeName = escapeHtml(firstName || "there");
  const safeUrl = escapeHtml(resetUrl);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #0077B5;">Reset your Somken Jobs password</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset the password for your Somken Jobs account.
         Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${safeUrl}" style="background: #0077B5; color: #fff; padding: 12px 24px;
           border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #555;">${safeUrl}</p>
      <p style="color: #888; font-size: 13px; margin-top: 28px;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    </div>`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your Somken Jobs password",
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    console.error(`[email] Resend send failed (${response.status}): ${detail}`);
    throw new Error("Failed to send password reset email");
  }

  return true;
}
