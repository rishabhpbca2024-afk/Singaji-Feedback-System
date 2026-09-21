const Faculty = require("../models/Faculty");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { encryptToken } = require("../utils/tokenEncryption");
const { validatePassword } = require("../utils/passwordValidator");
const { sendFacultyCredentialsEmail } = require("../utils/sendEmail");

const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .select("facultyId name gmail section subjects isActive")
      .sort({ section: 1, name: 1 });

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
        process.env.NODE_ENV === "production"
          ? "Failed to fetch faculty"
          : error.message,
    });
  }
};


const createFaculty = async (req, res) => {
  try {
    const { name, gmail, subjects, section } = req.body;

    // Required fields
    if (!name || !gmail || !subjects || !section) {
      return res.status(400).json({
        success: false,
        message: "Name, gmail, subjects and section are required",
      });
    }

    // Subjects should be an array
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one subject is required",
      });
    }

    // Check duplicate gmail
    const existingFaculty = await Faculty.findOne({ gmail });

    if (existingFaculty) {
      return res.status(409).json({
        success: false,
        message: "Faculty with this gmail already exists",
      });
    }

    // Find last faculty ID of this section
    const lastFaculty = await Faculty.findOne({
      section,
      facultyId: { $regex: `^${section.replace(".", "\\.")}-F\\d+$` },
    }).sort({ facultyId: -1 });

    let nextNumber = 1;

    if (lastFaculty) {
      const lastNumber = parseInt(
        lastFaculty.facultyId.split("-F")[1],
        10
      );

      nextNumber = lastNumber + 1;
    }

    const sectionPrefix = section.replace(".", "");

    const facultyId = `${sectionPrefix}-F${String(nextNumber).padStart(3, "0")}`;

    // Institutional temporary initial password
    const initialPassword = "Faculty@123";

    // Hash password using standardized bcrypt (M-7)
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const faculty = await Faculty.create({
      facultyId,
      name: name.trim(),
      gmail: gmail.toLowerCase().trim(),
      password: hashedPassword,
      mustChangePassword: true,
      section,
      subjects,
      isActive: true,
    });

    // Send institutional credentials email to faculty
    try {
      await sendFacultyCredentialsEmail({
        to: faculty.gmail,
        facultyName: faculty.name,
        facultyId: faculty.facultyId,
        tempPassword: initialPassword,
      });
    } catch (emailErr) {
      console.error(
        "Failed to send faculty credentials email:",
        emailErr.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      faculty: {
        id: faculty._id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        gmail: faculty.gmail,
        section: faculty.section,
        subjects: faculty.subjects,
        isActive: faculty.isActive,
        mustChangePassword: faculty.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Create faculty error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Failed to create faculty"
          : error.message,
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

    // Check duplicate gmail
    const existingFaculty = await Faculty.findOne({
      gmail: gmail.toLowerCase().trim(),
      facultyId: { $ne: facultyId },
    });

    if (existingFaculty) {
      return res.status(409).json({
        success: false,
        message: "This gmail is already registered with another faculty",
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

    await Faculty.deleteOne({ facultyId });

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
      token,
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Failed to change password."
          : error.message,
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
