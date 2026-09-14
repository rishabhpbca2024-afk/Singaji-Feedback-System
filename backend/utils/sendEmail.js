const { google } = require("googleapis");
const crypto = require("crypto");
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
// CREATE RAW EMAIL
// =====================================================

const createRawMessage = ({
  from,
  to,
  subject,
  html,
}) => {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");

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

      studentGmail: studentEmail
        .trim()
        .toLowerCase(),

      department: (department || "").trim(),

      level: (level || "").trim(),

      section: (section || "").trim(),

      facultyId: facultyId.trim(),

      facultyName: facultyName.trim(),

      subject: subject.trim(),

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
    // 5. HTML EMAIL
    // ==========================================

    const html = `
      <h2>Student Feedback</h2>

      <p>Hello,</p>

      <p>Please submit your feedback for:</p>

      <p>
        <strong>Department:</strong> ${department}<br>
        <strong>Faculty:</strong> ${facultyName}<br>
        <strong>Subject:</strong> ${subject}<br>
        <strong>Class:</strong> ${level || "Not available"}<br>
        <strong>Time:</strong> ${time}<br>
        <strong>Lecture End Time:</strong> ${
          endTime || "Not available"
        }
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

    const rawMessage = createRawMessage({
      from: process.env.MAIL_USER,
      to: studentEmail,
      subject: `Feedback Required - ${facultyName}`,
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
      `[EMAIL SENT] To: ${studentEmail}`
    );

    console.log(
      `[GMAIL API] Message ID: ${response.data.id}`
    );

    return {
      success: true,
      message: "Email sent successfully",
      studentEmail,
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

module.exports = {
  sendFeedbackLinkEmail,
};