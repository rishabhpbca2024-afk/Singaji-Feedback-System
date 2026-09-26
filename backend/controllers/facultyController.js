const crypto = require("crypto");
const Faculty = require("../models/Faculty");
const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { encryptToken } = require("../utils/tokenEncryption");
const { validatePassword } = require("../utils/passwordValidator");
const {
  sendFacultyCredentialsEmail,
  sendFacultyActivationEmail,
} = require("../utils/sendEmail");

/**
 * Checks for duplicate faculty emails, taking into account Gmail '.' and '+' alias tricks (R-7).
 * Also prevents collisions with existing Administrator accounts.
 */
const checkDuplicateGmail = async (inputEmail, excludeFacultyId = null) => {
  const normalized = String(inputEmail || "").toLowerCase().trim();
  const parts = normalized.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleanLocal = localPart.split("+")[0].replace(/\./g, "");
    if (!cleanLocal) return false;

    const regexPattern =
      "^" +
      cleanLocal
        .split("")
        .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("\\.?") +
      "(\\+[^@]*)?@(gmail|googlemail)\\.com$";

    // 1. Prevent collision with Administrator accounts
    const adminConflict = await Admin.findOne({
      gmail: { $regex: new RegExp(regexPattern, "i") },
    });
    if (adminConflict) return true;

    // 2. Prevent collision with other Faculty accounts
    const query = {
      gmail: { $regex: new RegExp(regexPattern, "i") },
    };
    if (excludeFacultyId) {
      query.facultyId = { $ne: excludeFacultyId };
    }
    const existing = await Faculty.findOne(query);
    return !!existing;
  }

  // Non-gmail domain checks
  const adminConflict = await Admin.findOne({ gmail: normalized });
  if (adminConflict) return true;

  const query = { gmail: normalized };
  if (excludeFacultyId) {
    query.facultyId = { $ne: excludeFacultyId };
  }
  const existing = await Faculty.findOne(query);
  return !!existing;
};

const getAllFaculty = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "Admin";

    // Admins get full management fields; Faculty get only schedule display fields (M-6)
    const selectFields = isAdmin
      ? "facultyId name gmail section subjects isActive isActivated"
      : "facultyId name section subjects";

    // Active faculty by default (L-8: soft-delete preservation)
    const filter =
      isAdmin && req.query.includeInactive === "true"
        ? {}
        : { isActive: { $ne: false } };

    const faculty = await Faculty.find(filter)
      .select(selectFields)
      .sort({ section: 1, name: 1 })
      .lean();

    const sections = {
      ITEG: [],
      MEG: [],
      BEG: [],
      "B.Tech": [],
    };

    faculty.forEach((teacher) => {
      if (sections[teacher.section]) {
        sections[teacher.section].push(teacher);
      }
    });

    return res.status(200).json({
      success: true,
      sections,
    });
  } catch (error) {
    console.error("Get all faculty error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch faculty",
    });
  }
};


const createFaculty = async (req, res) => {
  try {
    const { name, gmail, subjects, section } = req.body || {};

    // Required fields with strict type checks
    if (
      !name ||
      typeof name !== "string" ||
      !name.trim() ||
      !gmail ||
      typeof gmail !== "string" ||
      !gmail.trim() ||
      !section ||
      typeof section !== "string" ||
      !section.trim() ||
      !subjects
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name, gmail, subjects and section are required",
      });
    }

    const trimmedSection = section.trim();
    const VALID_SECTIONS = ["ITEG", "MEG", "BEG", "B.Tech"];
    if (!VALID_SECTIONS.includes(trimmedSection)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}`,
      });
    }

    // Subjects should be an array of non-empty strings
    if (
      !Array.isArray(subjects) ||
      subjects.length === 0 ||
      subjects.some((s) => typeof s !== "string" || !s.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one valid subject is required",
      });
    }

    // Check duplicate gmail with alias defense (R-7)
    const isDuplicate = await checkDuplicateGmail(gmail);

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: "Faculty with this gmail (or an alias of it) already exists, or the email is reserved for an Administrator",
      });
    }

    const sectionPrefix = trimmedSection.replace(/\./g, "");
    const safePrefix = sectionPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Find all existing faculty IDs of this section (case-insensitive) to determine next number
    const existingFaculties = await Faculty.find({
      facultyId: { $regex: `^${safePrefix}-F\\d+$`, $options: "i" },
    }).select("facultyId").lean();

    let maxNumber = 0;
    existingFaculties.forEach((f) => {
      const match = f.facultyId.match(/-F(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    const facultyId = `${sectionPrefix}-F${String(nextNumber).padStart(3, "0")}`;

    // Generate 32-byte cryptographically secure random token (R-1)
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash token using SHA-256 for secure database storage (R-2)
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Expiry: 48 hours (R-2)
    const activationTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const faculty = await Faculty.create({
      facultyId,
      name: name.trim(),
      gmail: gmail.toLowerCase().trim(), // Existing storage format preserved (R-7)
      password: null, // No default password (R-1)
      isActivated: false, // Inactive until faculty sets password (R-6)
      activationToken: hashedToken,
      activationTokenExpires,
      mustChangePassword: false,
      section,
      subjects,
      isActive: true,
    });

    // Frontend activation link (R-3 / M-8)
    const frontendUrl = (process.env.FRONTEND_URL
      ? (process.env.FRONTEND_URL.startsWith("http")
        ? process.env.FRONTEND_URL
        : `https://${process.env.FRONTEND_URL}`)
      : "http://localhost:5173").replace(/\/$/, "");

    const activationUrl = `${frontendUrl}/activate-account#token=${encodeURIComponent(rawToken)}`;

    // Send activation link to registered email directly from DB document (R-3)
    try {
      await sendFacultyActivationEmail({
        to: faculty.gmail,
        facultyName: faculty.name,
        facultyId: faculty.facultyId,
        activationUrl,
      });
    } catch (emailErr) {
      console.error(
        "Failed to send faculty activation email:",
        emailErr.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Faculty created successfully. An activation link has been sent to their registered email.",
      faculty: {
        id: faculty._id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        gmail: faculty.gmail,
        section: faculty.section,
        subjects: faculty.subjects,
        isActive: faculty.isActive,
        isActivated: faculty.isActivated,
      },
    });
  } catch (error) {
    console.error("Create faculty error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A faculty with this email or faculty ID already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to create faculty",
    });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { name, gmail, subjects } = req.body;

    if (!name || !gmail || !subjects) {
      return res.status(400).json({
        success: false,
        message: "Name, gmail and subjects are required",
      });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one subject is required",
      });
    }

    const faculty = await Faculty.findOne({ facultyId: String(facultyId).trim() });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Check duplicate gmail with alias defense (R-7)
    const isDuplicate = await checkDuplicateGmail(gmail, facultyId);

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: "This gmail (or an alias of it) is already registered with another faculty or Administrator",
      });
    }

    faculty.name = name.trim();
    faculty.gmail = gmail.toLowerCase().trim();
    faculty.subjects = subjects;

    await faculty.save();

    return res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      faculty: {
        _id: faculty._id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        gmail: faculty.gmail,
        section: faculty.section,
        subjects: faculty.subjects,
        isActive: faculty.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating faculty:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await Faculty.findOne({ facultyId });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Soft delete: Mark isActive as false to preserve historical feedback and ratings integrity (L-8)
    faculty.isActive = false;
    await faculty.save();

    return res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting faculty:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be a valid string.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    // Validate new password complexity
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Fetch faculty by authenticated ID
    const faculty = await Faculty.findById(req.user.userId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    // Verify current password using bcrypt
    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      faculty.password
    );

    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update faculty record
    faculty.password = hashedPassword;
    faculty.mustChangePassword = false;
    faculty.passwordChangedAt = new Date();
    await faculty.save();

    // Issue a fresh JWT so user can immediately continue with valid session
    const token = jwt.sign(
      {
        userId: faculty._id,
        role: "Faculty",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const encryptedToken = encryptToken(token);

    res.cookie("accessToken", encryptedToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      mustChangePassword: false,
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to change password.",
    });
  }
};

module.exports = {
  getAllFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  changePassword,
};
