const mongoose = require("mongoose");
const SelectedStudents = require("../models/SeletedStudents");
const { safeErrorMessage } = require("../utils/errorHandler");

const saveSelectedStudents = async (req, res) => {
  const { department, level, students } = req.body || {};

  if (!department || !level || !students) {
    return res.status(400).json({
      success: false,
      message: "Department, level and students are required",
    });
  }

  if (!Array.isArray(students)) {
    return res.status(400).json({
      success: false,
      message: "Students must be an array",
    });
  }

  if (students.length !== 10) {
    return res.status(400).json({
      success: false,
      message: "Exactly 10 students must be selected",
    });
  }

  // Pre-validate all 10 students before touching database (M-3)
  const sanitizedStudents = [];
  const seenGmails = new Set();

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    if (
      !s ||
      typeof s.name !== "string" ||
      typeof s.gmail !== "string" ||
      !s.name.trim() ||
      !s.gmail.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: `Student at position ${i + 1} has invalid name or gmail`,
      });
    }

    const normalizedGmail = s.gmail.toLowerCase().trim();

    // Validate email format (L-7)
    const EMAIL_RE = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;
    if (!EMAIL_RE.test(normalizedGmail)) {
      return res.status(400).json({
        success: false,
        message: `Student at position ${i + 1} has an invalid email format: ${normalizedGmail}`,
      });
    }

    if (seenGmails.has(normalizedGmail)) {
      return res.status(400).json({
        success: false,
        message: `Duplicate student gmail detected: ${normalizedGmail}`,
      });
    }
    seenGmails.add(normalizedGmail);

    sanitizedStudents.push({
      department: String(department).trim(),
      level: String(level).trim(),
      name: s.name.trim(),
      gmail: normalizedGmail,
    });
  }

  // Validate that all selected students exist in the registered Students collection (L-7)
  const Student = require("../models/Students");
  const gmailsToCheck = sanitizedStudents.map((s) => s.gmail);
  const foundStudents = await Student.find({
    gmail: { $in: gmailsToCheck },
  })
    .select("gmail")
    .lean();

  const foundSet = new Set(foundStudents.map((s) => s.gmail.toLowerCase().trim()));
  const missingStudents = gmailsToCheck.filter((g) => !foundSet.has(g));

  if (missingStudents.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot select unregistered students: ${missingStudents.join(", ")}`,
    });
  }

  // Use MongoDB session/transaction if available (M-3)
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    await SelectedStudents.deleteMany(
      {
        department: String(department).trim(),
        level: String(level).trim(),
      },
      { session }
    );

    const savedStudents = await SelectedStudents.insertMany(
      sanitizedStudents,
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "10 students selected successfully",
      data: savedStudents,
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch {
        // Fallback for standalone MongoDB environments that do not support transactions
      }
    }

    // If transaction failed due to standalone mongo, execute standard sequence
    if (error.message?.includes("Transaction") || error.message?.includes("replica set")) {
      try {
        await SelectedStudents.deleteMany({
          department: String(department).trim(),
          level: String(level).trim(),
        });

        const savedStudents = await SelectedStudents.insertMany(
          sanitizedStudents
        );

        return res.status(200).json({
          success: true,
          message: "10 students selected successfully",
          data: savedStudents,
        });
      } catch (fallbackErr) {
        console.error("Fallback selected students error:", fallbackErr);
        return res.status(500).json({
          success: false,
          message: safeErrorMessage(fallbackErr, "Failed to save selected students"),
        });
      }
    }

    console.error("Error selecting students:", error);

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to save selected students"),
    });
  }
};

const getSelectedStudents = async (req, res) => {
  try {
    const { department, level } = req.query;

    if (!department || !level) {
      return res.status(400).json({
        success: false,
        message: "Department and level are required",
      });
    }

    const students = await SelectedStudents.find({
      department: String(department).trim(),
      level: String(level).trim(),
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching selected students:", error);

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to fetch selected students"),
    });
  }
};

module.exports = {
  saveSelectedStudents,
  getSelectedStudents,
};