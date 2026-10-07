const bcrypt = require("bcrypt");
const xlsx = require("xlsx");
const Student = require("../models/Students");
const { safeErrorMessage } = require("../utils/errorHandler");

const VALID_SECTIONS = ["ITEG", "MEG", "BEG", "B.Tech"];
const VALID_LEVELS = ["1A", "1B", "1C", "2A", "2B", "2C"];

/**
 * Normalizes section name variations
 */
const normalizeSection = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  const lower = s.toLowerCase().replace(/[\s\.-]/g, "");
  if (lower === "iteg") return "ITEG";
  if (lower === "meg") return "MEG";
  if (lower === "beg") return "BEG";
  if (lower === "btech") return "B.Tech";
  if (VALID_SECTIONS.includes(s)) return s;
  return "";
};

/**
 * Normalizes level name variations
 */
const normalizeLevel = (val) => {
  if (!val) return "";
  const l = String(val).trim().toUpperCase();
  if (VALID_LEVELS.includes(l)) return l;
  return "";
};

// ==========================================
// 1. GET ALL STUDENTS (Grouped by section & level)
// ==========================================
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("studentId name gmail section level createdAt")
      .sort({ section: 1, level: 1, studentId: 1 });

    const sections = {
      ITEG: { "1A": [], "1B": [], "1C": [], "2A": [], "2B": [], "2C": [] },
      MEG: { "1A": [], "1B": [], "1C": [], "2A": [], "2B": [], "2C": [] },
      BEG: { "1A": [], "1B": [], "1C": [], "2A": [], "2B": [], "2C": [] },
      "B.Tech": { "1A": [], "1B": [], "1C": [], "2A": [], "2B": [], "2C": [] },
    };

    students.forEach((student) => {
      if (
        sections[student.section] &&
        sections[student.section][student.level]
      ) {
        sections[student.section][student.level].push(student);
      }
    });

    return res.status(200).json({
      success: true,
      totalCount: students.length,
      sections,
    });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to fetch students"),
    });
  }
};

// ==========================================
// 2. ADD SINGLE STUDENT (Manual form)
// ==========================================
const addStudent = async (req, res) => {
  try {
    const { studentId, name, gmail, section, level, password } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid student name (minimum 2 characters).",
      });
    }

    if (!gmail || typeof gmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid Gmail/Email address.",
      });
    }

    const normSection = normalizeSection(section);
    if (!normSection) {
      return res.status(400).json({
        success: false,
        message: `Department must be one of: ${VALID_SECTIONS.join(", ")}`,
      });
    }

    const normLevel = normalizeLevel(level);
    if (!normLevel) {
      return res.status(400).json({
        success: false,
        message: `Class Level must be one of: ${VALID_LEVELS.join(", ")}`,
      });
    }

    const trimmedStudentId = studentId && String(studentId).trim()
      ? String(studentId).trim()
      : `${normSection}-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;

    const normalizedGmail = gmail.trim().toLowerCase();

    // Check duplicate studentId
    const existingId = await Student.findOne({ studentId: trimmedStudentId });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: `A student with ID "${trimmedStudentId}" already exists.`,
      });
    }

    // Check duplicate gmail
    const existingGmail = await Student.findOne({ gmail: normalizedGmail });
    if (existingGmail) {
      return res.status(400).json({
        success: false,
        message: `A student with email "${normalizedGmail}" already exists.`,
      });
    }

    const plainPassword = password && String(password).trim() ? String(password).trim() : "student123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newStudent = await Student.create({
      studentId: trimmedStudentId,
      name: name.trim(),
      gmail: normalizedGmail,
      password: hashedPassword,
      section: normSection,
      level: normLevel,
    });

    return res.status(201).json({
      success: true,
      message: `Student "${newStudent.name}" added successfully to ${normSection} (${normLevel})!`,
      student: {
        id: newStudent._id,
        studentId: newStudent.studentId,
        name: newStudent.name,
        gmail: newStudent.gmail,
        section: newStudent.section,
        level: newStudent.level,
      },
    });
  } catch (error) {
    console.error("Add student error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate student: Either Student ID or Email already exists in the system.",
      });
    }
    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to add student"),
    });
  }
};

// ==========================================
// 3. BULK UPLOAD STUDENTS FROM EXCEL / CSV
// ==========================================
const uploadStudentsExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No Excel or CSV file uploaded. Please select a valid .xlsx, .xls or .csv file.",
      });
    }

    const { defaultSection, defaultLevel } = req.body || {};

    // Parse workbook from buffer
    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: "Unable to read file. Please ensure it is a valid Excel (.xlsx, .xls) or CSV file.",
      });
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return res.status(400).json({
        success: false,
        message: "The uploaded Excel file does not contain any worksheets.",
      });
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file is empty. Please add student data and try again.",
      });
    }

    // Hash default password once for high performance batch insertion
    const defaultHashedPassword = await bcrypt.hash("student123", 10);

    // Fetch all existing studentIds and emails to detect duplicates quickly in memory
    const existingStudents = await Student.find().select("studentId gmail").lean();
    const existingIdSet = new Set(existingStudents.map((s) => s.studentId.toLowerCase().trim()));
    const existingGmailSet = new Set(existingStudents.map((s) => s.gmail.toLowerCase().trim()));

    const seenInFileIds = new Set();
    const seenInFileGmails = new Set();

    const studentsToInsert = [];
    const skippedDetails = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // Accounting for 1-indexed Excel header at row 1

      // Find fields flexibly by looking through row keys
      const keys = Object.keys(row);
      const getKeyVal = (matcher) => {
        const foundKey = keys.find((k) => matcher.test(k.trim().toLowerCase()));
        return foundKey ? String(row[foundKey]).trim() : "";
      };

      const rawName = getKeyVal(/^(name|student\s*name|full\s*name|student_name)$/i);
      const rawEmail = getKeyVal(/^(gmail|email|email\s*address|mail|student\s*email)$/i);
      const rawId = getKeyVal(/^(studentid|student\s*id|roll\s*no|roll\s*number|id|enrollment.*|rollno|roll_no)$/i);
      const rawSection = getKeyVal(/^(section|department|dept|branch)$/i);
      const rawLevel = getKeyVal(/^(level|class|semester|sem|year)$/i);
      const rawPassword = getKeyVal(/^(password|pwd)$/i);

      // Name validation
      if (!rawName || rawName.length < 2) {
        skippedDetails.push({ row: rowNum, reason: "Missing or invalid Student Name" });
        return;
      }

      // Email validation
      const normalizedGmail = rawEmail.toLowerCase().trim();
      if (!normalizedGmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedGmail)) {
        skippedDetails.push({ row: rowNum, name: rawName, reason: "Missing or invalid Email format" });
        return;
      }

      // Department normalization (use row value or fall back to defaultSection from context)
      const normSection = normalizeSection(rawSection || defaultSection);
      if (!normSection) {
        skippedDetails.push({
          row: rowNum,
          name: rawName,
          reason: `Invalid or missing Department (Must be ITEG, MEG, BEG, or B.Tech)`,
        });
        return;
      }

      // Level normalization (use row value or fall back to defaultLevel from context)
      const normLevel = normalizeLevel(rawLevel || defaultLevel);
      if (!normLevel) {
        skippedDetails.push({
          row: rowNum,
          name: rawName,
          reason: `Invalid or missing Level (Must be 1A, 1B, 1C, 2A, 2B, or 2C)`,
        });
        return;
      }

      // Student ID normalization
      let finalStudentId = rawId;
      if (!finalStudentId) {
        finalStudentId = `${normSection}-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
      }

      const lowerId = finalStudentId.toLowerCase().trim();

      // Check duplicates in DB
      if (existingIdSet.has(lowerId)) {
        skippedDetails.push({
          row: rowNum,
          name: rawName,
          reason: `Student ID "${finalStudentId}" already registered in database`,
        });
        return;
      }

      if (existingGmailSet.has(normalizedGmail)) {
        skippedDetails.push({
          row: rowNum,
          name: rawName,
          reason: `Email "${normalizedGmail}" already registered in database`,
        });
        return;
      }

      // Check duplicates within this same uploaded file
      if (seenInFileIds.has(lowerId)) {
        skippedDetails.push({
          row: rowNum,
          name: rawName,
          reason: `Duplicate Student ID "${finalStudentId}" in this Excel file`,
        });
        return;
      }

      if (seenInFileGmails.has(normalizedGmail)) {
        skippedDetails.push({
          row: rowNum,
          name: rawName,
          reason: `Duplicate Email "${normalizedGmail}" in this Excel file`,
        });
        return;
      }

      seenInFileIds.add(lowerId);
      seenInFileGmails.add(normalizedGmail);

      studentsToInsert.push({
        studentId: finalStudentId,
        name: rawName,
        gmail: normalizedGmail,
        section: normSection,
        level: normLevel,
        password: rawPassword ? bcrypt.hashSync(rawPassword, 10) : defaultHashedPassword,
      });
    });

    if (studentsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid students could be imported from the file.",
        totalRows: rawRows.length,
        importedCount: 0,
        skippedCount: skippedDetails.length,
        skippedDetails,
      });
    }

    const inserted = await Student.insertMany(studentsToInsert, { ordered: false });

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${inserted.length} students!${skippedDetails.length > 0 ? ` (${skippedDetails.length} rows skipped due to duplicates/validation)` : ""}`,
      totalRows: rawRows.length,
      importedCount: inserted.length,
      skippedCount: skippedDetails.length,
      skippedDetails: skippedDetails.slice(0, 20), // preview first 20 errors if any
    });
  } catch (error) {
    console.error("Upload students excel error:", error);
    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to import students from Excel file"),
    });
  }
};

// ==========================================
// 4. DOWNLOAD EXCEL SAMPLE TEMPLATE
// ==========================================
const downloadExcelTemplate = async (req, res) => {
  try {
    const { department = "ITEG", level = "1A" } = req.query || {};

    const normDept = normalizeSection(department) || "ITEG";
    const normLvl = normalizeLevel(level) || "1A";

    const sampleData = [
      {
        "Student ID": `${normDept}-2024-001`,
        "Student Name": "Aman Sharma",
        "Gmail": "aman.sharma@example.com",
        "Department": normDept,
        "Level": normLvl,
        "Password": "student123",
      },
      {
        "Student ID": `${normDept}-2024-002`,
        "Student Name": "Pooja Patel",
        "Gmail": "pooja.patel@example.com",
        "Department": normDept,
        "Level": normLvl,
        "Password": "student123",
      },
      {
        "Student ID": `${normDept}-2024-003`,
        "Student Name": "Rahul Verma",
        "Gmail": "rahul.verma@example.com",
        "Department": normDept,
        "Level": normLvl,
        "Password": "student123",
      },
      {
        "Student ID": `${normDept}-2024-004`,
        "Student Name": "Sneha Joshi",
        "Gmail": "sneha.joshi@example.com",
        "Department": normDept,
        "Level": normLvl,
        "Password": "student123",
      },
      {
        "Student ID": `${normDept}-2024-005`,
        "Student Name": "Deepak Yadav",
        "Gmail": "deepak.yadav@example.com",
        "Department": normDept,
        "Level": normLvl,
        "Password": "student123",
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleData);

    // Auto set column widths
    worksheet["!cols"] = [
      { wch: 18 }, // Student ID
      { wch: 22 }, // Student Name
      { wch: 28 }, // Gmail
      { wch: 15 }, // Department
      { wch: 10 }, // Level
      { wch: 14 }, // Password
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Students_Template");

    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    const filename = `Students_Import_Template_${normDept}_${normLvl}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(excelBuffer);
  } catch (error) {
    console.error("Download template error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Excel template",
    });
  }
};

// ==========================================
// 5. DELETE STUDENT
// ==========================================
const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const deleted = await Student.findOneAndDelete({
      $or: [{ studentId }, { _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }],
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student "${deleted.name}" (${deleted.studentId}) deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to delete student"),
    });
  }
};

module.exports = {
  getStudents,
  addStudent,
  uploadStudentsExcel,
  downloadExcelTemplate,
  deleteStudent,
};