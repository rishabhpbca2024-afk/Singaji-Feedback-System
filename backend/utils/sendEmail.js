const { google } = require("googleapis");
const crypto = require("crypto");
const escapeHtml = require("escape-html");
const MailComposer = require("nodemailer/lib/mail-composer");
const FeedbackToken = require("../models/FeedbackToken");

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

    const feedbackUrl =
      `${process.env.FRONTEND_URL}/student/feedback` +
      `?token=${encodeURIComponent(rawToken)}`;

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
      `[EMAIL SENT] To: ${normalizedEmail}`
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

module.exports = {
  sendFeedbackLinkEmail,
  sendFacultyCredentialsEmail,
  sendPasswordResetEmail,
};