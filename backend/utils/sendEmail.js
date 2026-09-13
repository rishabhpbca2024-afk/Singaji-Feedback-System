const nodemailer = require("nodemailer");
const crypto = require("crypto");
const FeedbackToken = require("../models/FeedbackToken");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

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

      department: (department || "")
        .trim(),

      level: (level || "")
        .trim(),

      section: (section || "")
        .trim(),

      facultyId: facultyId
        .trim(),

      facultyName: facultyName
        .trim(),

      subject: subject
        .trim(),

      lectureTime: (time || "")
        .trim(),

      lectureEndTime: (endTime || "")
        .trim(),

      expiresAt,

      usedAt: null,
    });

    // ==========================================
    // 4. FEEDBACK URL
    // ==========================================

    const feedbackUrl =
      `http://localhost:5173/student/feedback` +
      `?token=${encodeURIComponent(rawToken)}`;

    // ==========================================
    // 5. EMAIL
    // ==========================================

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: studentEmail,

      subject: `Feedback Required - ${facultyName}`,

      html: `
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
      `,
    };

    // ==========================================
    // 6. SEND EMAIL
    // ==========================================

    const info = await transporter.sendMail(
      mailOptions
    );

    console.log(
      `[EMAIL SENT] To: ${studentEmail}`
    );    
    return {
      success: true,
      message: "Email sent successfully",
      studentEmail,
      feedbackUrl,
      lectureEndTime: endTime,
    };
  } catch (error) {
    console.error("EMAIL ERROR:", error);

    return {
      success: false,
      message: "Failed to send email",
      error: error.message,
    };
  }
};

module.exports = {
  sendFeedbackLinkEmail,
};