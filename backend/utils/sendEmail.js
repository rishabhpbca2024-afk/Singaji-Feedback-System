const { google } = require("googleapis");
const crypto = require("crypto");
const escapeHtml = require("escape-html");
const MailComposer = require("nodemailer/lib/mail-composer");
const FeedbackToken = require("../models/FeedbackToken");
const { maskEmail } = require("./hashUtils");

// =====================================================
// GMAIL API AUTH
// =====================================================

const auth = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

auth.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth,
});

// =====================================================
// CREATE RAW EMAIL (COMPILED SAFELY VIA NODEMAILER)
// =====================================================

const createRawMessage = async ({
  from,
  to,
  subject,
  html,
}) => {
  const mail = new MailComposer({
    from,
    to,
    subject,
    html,
  });

  const message = await mail.compile().build();

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// =====================================================
// SEND FEEDBACK EMAIL
// =====================================================

const sendFeedbackLinkEmail = async (
  studentEmail,
  department,
  level,
  section,
  facultyId,
  facultyName,
  subject,
  time,
  endTime
) => {
  try {
    // ==========================================
    // 0. DEFENSE-IN-DEPTH EMAIL VALIDATION
    // ==========================================

    if (/[\r\n]/.test(studentEmail)) {
      return {
        success: false,
        message: "Invalid email address",
      };
    }

    const normalizedEmail = String(studentEmail || "").trim().toLowerCase();
    const EMAIL_RE = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;

    if (!EMAIL_RE.test(normalizedEmail)) {
      return {
        success: false,
        message: "Invalid email address",
      };
    }


    // ==========================================
    // 1. GENERATE SECURE RANDOM TOKEN
    // ==========================================

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // ==========================================
    // 2. TOKEN EXPIRY
    // ==========================================

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // ==========================================
    // 3. SAVE TRUSTED DATA
    // ==========================================

    await FeedbackToken.create({
      tokenHash,

      studentGmail: normalizedEmail,

      department: (department || "").trim(),

      level: (level || "").trim(),

      section: (section || "").trim(),

      facultyId: (facultyId || "").trim(),

      facultyName: (facultyName || "").trim(),

      subject: (subject || "").trim(),

      lectureTime: (time || "").trim(),

      lectureEndTime: (endTime || "").trim(),

      expiresAt,

      usedAt: null,
    });

    // ==========================================
    // 4. FEEDBACK URL
    // ==========================================

    const frontendBaseUrl = (
      process.env.FRONTEND_URL
        ? (process.env.FRONTEND_URL.startsWith("http")
            ? process.env.FRONTEND_URL
            : `https://${process.env.FRONTEND_URL}`)
        : "https://singaji-feedback-system.vercel.app"
    ).replace(/\/$/, "");

    const feedbackUrl =
      `${frontendBaseUrl}/student/feedback#token=${encodeURIComponent(rawToken)}`;

    // ==========================================
    // 5. HTML EMAIL (DYNAMIC VALUES ESCAPED)
    // ==========================================

    const safeDepartment = escapeHtml(String(department || "").trim());
    const safeFacultyName = escapeHtml(String(facultyName || "").trim());
    const safeSubject = escapeHtml(String(subject || "").trim());
    const safeLevel = level ? escapeHtml(String(level).trim()) : "Not available";
    const safeTime = escapeHtml(String(time || "").trim());
    const safeEndTime = endTime ? escapeHtml(String(endTime).trim()) : "Not available";

    const html = `
      <h2>Student Feedback</h2>

      <p>Hello,</p>

      <p>Please submit your feedback for:</p>

      <p>
        <strong>Department:</strong> ${safeDepartment}<br>
        <strong>Faculty:</strong> ${safeFacultyName}<br>
        <strong>Subject:</strong> ${safeSubject}<br>
        <strong>Class:</strong> ${safeLevel}<br>
        <strong>Time:</strong> ${safeTime}<br>
        <strong>Lecture End Time:</strong> ${safeEndTime}
      </p>

      <p>
        <a href="${feedbackUrl}">
          Click here to submit your feedback
        </a>
      </p>

      <p>
        This feedback link is personal to your college email
        and should not be shared.
      </p>

      <p>Thank you.</p>
    `;

    // ==========================================
    // 6. CREATE RAW MESSAGE
    // ==========================================

    const cleanFacultyName = String(facultyName || "").replace(/[\r\n]/g, " ").trim();

    const rawMessage = await createRawMessage({
      from: process.env.MAIL_USER,
      to: normalizedEmail,
      subject: `Feedback Required - ${cleanFacultyName}`,
      html,
    });

    // ==========================================
    // 7. SEND USING GMAIL API
    // ==========================================

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(
      `[EMAIL SENT] To: ${maskEmail(normalizedEmail)}`
    );

    console.log(
      `[GMAIL API] Message ID: ${response.data.id}`
    );

    return {
      success: true,
      message: "Email sent successfully",
      studentEmail: normalizedEmail,
      feedbackUrl,
      lectureEndTime: endTime,
      messageId: response.data.id,
    };

  } catch (error) {
    console.error(
      "[GMAIL API EMAIL ERROR]:",
      error.response?.data || error.message
    );

    return {
      success: false,
      message: "Failed to send email",
      error:
        error.response?.data?.error?.message ||
        error.message,
    };
  }
};

// =====================================================
// SEND FACULTY CREDENTIALS EMAIL (WELCOME / FIRST LOGIN)
// =====================================================

const sendFacultyCredentialsEmail = async ({
  to,
  facultyName,
  facultyId,
  tempPassword,
}) => {
  try {
    const loginUrl = process.env.FRONTEND_URL
      ? (process.env.FRONTEND_URL.startsWith("http")
          ? `${process.env.FRONTEND_URL}/login`
          : `https://${process.env.FRONTEND_URL}/login`)
      : "http://localhost:5173/login";

    const safeFacultyName = escapeHtml(String(facultyName || "Faculty Member").trim());
    const safeFacultyId = escapeHtml(String(facultyId || "").trim());
    const safeTo = escapeHtml(String(to || "").trim());
    const safeTempPassword = escapeHtml(String(tempPassword || "").trim());

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          Welcome to Singaji Feedback System
        </h2>
        <p>Dear <strong>${safeFacultyName}</strong>,</p>
        <p>Your institutional faculty account has been created by the administrator. Below are your account details and first-login credentials:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong>Faculty ID:</strong> ${safeFacultyId}</p>
          <p style="margin: 6px 0;"><strong>Institutional Email:</strong> ${safeTo}</p>
          <p style="margin: 6px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${safeTempPassword}</code></p>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important Notice:</strong> This initial password is a temporary first-login password. You will be required to change your password immediately upon your first sign-in before accessing the system.
          </p>
        </div>

        <p style="margin: 24px 0;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Sign In to Portal
          </a>
        </p>

        <p style="color: #64748b; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Singaji Institute of Science and Management &bull; Institutional Feedback Portal
        </p>
      </div>
    `;

    const rawMessage = await createRawMessage({
      from: process.env.MAIL_USER,
      to: String(to || "").trim(),
      subject: `Your Institutional Account Credentials - Singaji Feedback System`,
      html,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`[FACULTY EMAIL SENT] To: ${to}, Message ID: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error(
      "[GMAIL API FACULTY CREDENTIALS EMAIL ERROR]:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

// =====================================================
// SEND PASSWORD RESET EMAIL
// =====================================================

const sendPasswordResetEmail = async ({
  to,
  facultyName,
  resetUrl,
}) => {
  try {
    const safeFacultyName = escapeHtml(String(facultyName || "Faculty Member").trim());

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          Password Reset Request
        </h2>
        <p>Dear <strong>${safeFacultyName}</strong>,</p>
        <p>We received a request to reset your password for your Singaji Feedback System account.</p>

        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Your Password
          </a>
        </p>

        <p style="color: #475569; font-size: 14px;">
          Or copy and paste this URL into your browser:
        </p>
        <p style="word-break: break-all; color: #2563eb; font-size: 13px;">
          ${resetUrl}
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #334155; font-size: 13px;">
            <strong>Security Notice:</strong> This reset link is valid for <strong>15 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email; your existing password will remain secure.
          </p>
        </div>

        <p style="color: #64748b; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Singaji Institute of Science and Management &bull; Institutional Feedback Portal
        </p>
      </div>
    `;

    const rawMessage = await createRawMessage({
      from: process.env.MAIL_USER,
      to: String(to || "").trim(),
      subject: `Password Reset Request - Singaji Feedback System`,
      html,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`[PASSWORD RESET EMAIL SENT] To: ${to}, Message ID: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error(
      "[GMAIL API RESET EMAIL ERROR]:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

// =====================================================
// SEND FACULTY ACTIVATION EMAIL
// =====================================================

const sendFacultyActivationEmail = async ({
  to,
  facultyName,
  facultyId,
  activationUrl,
}) => {
  try {
    const safeFacultyName = escapeHtml(String(facultyName || "Faculty Member").trim());
    const safeFacultyId = escapeHtml(String(facultyId || "").trim());
    const safeTo = escapeHtml(String(to || "").trim());

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          Welcome to Singaji Feedback System
        </h2>
        <p>Dear <strong>${safeFacultyName}</strong>,</p>
        <p>Your institutional faculty account has been created by the administrator. Please activate your account and set your secure personal password using the link below:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 6px 0;"><strong>Faculty ID:</strong> ${safeFacultyId}</p>
          <p style="margin: 6px 0;"><strong>Institutional Email:</strong> ${safeTo}</p>
        </div>

        <p style="margin: 24px 0;">
          <a href="${activationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Activate Account & Set Password
          </a>
        </p>

        <p style="color: #475569; font-size: 14px;">
          Or copy and paste this URL into your browser:
        </p>
        <p style="word-break: break-all; color: #2563eb; font-size: 13px;">
          ${activationUrl}
        </p>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">
            <strong>Important Notice:</strong> This activation link is valid for <strong>48 hours</strong> and can only be used once. For security reasons, you cannot log in or access the portal until you set your password.
          </p>
        </div>

        <p style="color: #64748b; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Singaji Institute of Science and Management &bull; Institutional Feedback Portal
        </p>
      </div>
    `;

    const rawMessage = await createRawMessage({
      from: process.env.MAIL_USER,
      to: String(to || "").trim(),
      subject: `Activate Your Faculty Account - Singaji Feedback System`,
      html,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`[FACULTY ACTIVATION EMAIL SENT] To: ${to}, Message ID: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error(
      "[GMAIL API FACULTY ACTIVATION EMAIL ERROR]:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

// =====================================================
// SEND PASSWORD SET CONFIRMATION EMAIL
// =====================================================

const sendPasswordSetConfirmationEmail = async ({
  to,
  facultyName,
  facultyId,
}) => {
  try {
    const loginUrl = process.env.FRONTEND_URL
      ? (process.env.FRONTEND_URL.startsWith("http")
          ? `${process.env.FRONTEND_URL}/login`
          : `https://${process.env.FRONTEND_URL}/login`)
      : "http://localhost:5173/login";

    const safeFacultyName = escapeHtml(String(facultyName || "Faculty Member").trim());
    const safeFacultyId = escapeHtml(String(facultyId || "").trim());

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #16a34a; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">
          Account Activated Successfully
        </h2>
        <p>Dear <strong>${safeFacultyName}</strong>,</p>
        <p>Your password for your Singaji Feedback System faculty account (Faculty ID: <strong>${safeFacultyId}</strong>) has been successfully set, and your account is now fully active.</p>

        <p style="margin: 24px 0;">
          <a href="${loginUrl}" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Sign In to Your Account
          </a>
        </p>

        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #166534; font-size: 13px;">
            <strong>Security Notice:</strong> If you did not perform this action, please contact your system administrator immediately.
          </p>
        </div>

        <p style="color: #64748b; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Singaji Institute of Science and Management &bull; Institutional Feedback Portal
        </p>
      </div>
    `;

    const rawMessage = await createRawMessage({
      from: process.env.MAIL_USER,
      to: String(to || "").trim(),
      subject: `Account Activated & Password Set Successfully - Singaji Feedback System`,
      html,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`[PASSWORD SET CONFIRMATION SENT] To: ${to}, Message ID: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error(
      "[GMAIL API CONFIRMATION EMAIL ERROR]:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

// =====================================================
// SEND ADMIN SECURITY ALERT EMAIL
// =====================================================

const sendAdminPasswordChangedAlertEmail = async ({
  to,
  adminName,
  lockUrl,
  timestamp,
}) => {
  try {
    const safeAdminName = escapeHtml(String(adminName || "Administrator").trim());
    const formattedDate = new Date(timestamp || Date.now()).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 14px 18px; margin-bottom: 24px; border-radius: 4px;">
          <h2 style="color: #991b1b; margin: 0 0 6px 0; font-size: 20px;">
            🚨 Security Alert: Admin Password Changed
          </h2>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
            The password for your Singaji Feedback System Administrator account was recently changed.
          </p>
        </div>

        <p style="color: #334155; font-size: 15px;">Dear <strong>${safeAdminName}</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">
          This is an automated institutional security notification to inform you that your administrator password was changed on:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-family: monospace; font-size: 14px; color: #1e293b;">
          <strong>Time of Change:</strong> ${formattedDate} (IST)
        </div>

        <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
          <p style="margin: 0; color: #166534; font-size: 14px;">
            ✅ <strong>Was this you?</strong><br>
            If you recently changed your password yourself, you can safely disregard this email. Your new password is now active and prior sessions on other devices have been securely invalidated.
          </p>
        </div>

        <div style="margin: 24px 0; padding: 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
          <p style="margin: 0 0 14px 0; color: #991b1b; font-size: 14px; font-weight: bold;">
            ❌ Did NOT change your password?
          </p>
          <p style="margin: 0 0 16px 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">
            If you did not initiate this change, someone may have compromised your administrative credentials. Click below immediately to freeze your account, kill all unauthorized active sessions, and reclaim your account with a fresh password:
          </p>
          <div style="text-align: center; margin: 18px 0;">
            <a href="${lockUrl}" style="background-color: #dc2626; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
              🚨 No, This Wasn't Me — Lock Account & Reset
            </a>
          </div>
          <p style="margin: 12px 0 0 0; color: #64748b; font-size: 12px; word-break: break-all;">
            Or copy and paste this emergency link into your browser:<br>
            <a href="${lockUrl}" style="color: #dc2626;">${lockUrl}</a>
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center;">
          Singaji Institute of Science and Management &bull; Automated Security Dispatcher
        </p>
      </div>
    `;

    const rawMessage = await createRawMessage({
      from: process.env.MAIL_USER,
      to: String(to || "").trim(),
      subject: `🚨 SECURITY ALERT: Admin Password Changed - Singaji Feedback System`,
      html,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`[ADMIN SECURITY ALERT EMAIL SENT] To: ${to}, Message ID: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error(
      "[GMAIL API ADMIN SECURITY ALERT ERROR]:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

// =====================================================
// SEND BRUTE FORCE LOCKOUT ALERT EMAIL
// =====================================================

const sendBruteForceAlertEmail = async ({
  to,
  targetedEmail,
  failedAttempts,
  lockDurationMinutes,
  clientIp,
  timestamp,
}) => {
  try {
    const safeTargetedEmail = escapeHtml(String(targetedEmail || "").trim());
    const safeIp = escapeHtml(String(clientIp || "Unknown IP").trim());
    const formattedDate = new Date(timestamp || Date.now()).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px 18px; margin-bottom: 20px; border-radius: 4px;">
          <h2 style="color: #991b1b; margin: 0 0 6px 0; font-size: 18px;">
            ⚠️ Suspicious Activity Alert: Account Locked Due to Repeated Failed Logins
          </h2>
          <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
            Institutional security defense has temporarily locked an account to prevent brute force access.
          </p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          The Singaji Feedback System detected multiple consecutive failed login attempts targeting the following account:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-size: 13px; color: #1e293b;">
          <p style="margin: 4px 0;"><strong>Targeted Email:</strong> ${safeTargetedEmail}</p>
          <p style="margin: 4px 0;"><strong>Failed Attempts:</strong> ${Number(failedAttempts) || 5}</p>
          <p style="margin: 4px 0;"><strong>Lockout Duration:</strong> ${Number(lockDurationMinutes) || 15} minutes</p>
          <p style="margin: 4px 0;"><strong>Last Source IP:</strong> ${safeIp}</p>
          <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${formattedDate} (IST)</p>
        </div>

        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #166534; font-size: 13px;">
            <strong>System Action Taken:</strong> The account has been temporarily locked at the database level. All further login attempts will be automatically rejected until the lockout expires or a valid credential is submitted.
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
          Singaji Institute of Science and Management &bull; Automated Intrusion Defense
        </p>
      </div>
    `;

    const recipient = String(to || process.env.MAIL_USER || "").trim();
    if (!recipient) {
      console.warn("[BRUTE FORCE ALERT] No recipient email specified.");
      return { success: false, message: "No recipient specified." };
    }

    const rawMessage = await createRawMessage({
      from: process.env.MAIL_USER,
      to: recipient,
      subject: `⚠️ SECURITY ALERT: Account Locked Due to Failed Logins (${safeTargetedEmail})`,
      html,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`[BRUTE FORCE ALERT EMAIL SENT] To: ${recipient}, Message ID: ${response.data.id}`);

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error(
      "[GMAIL API BRUTE FORCE ALERT ERROR]:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

module.exports = {
  sendFeedbackLinkEmail,
  sendFacultyCredentialsEmail,
  sendPasswordResetEmail,
  sendFacultyActivationEmail,
  sendPasswordSetConfirmationEmail,
  sendAdminPasswordChangedAlertEmail,
  sendBruteForceAlertEmail,
};