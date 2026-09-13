const Faculty = require("../models/Faculty");

const bcrypt = require("bcrypt");

const facultyLogin = async (req, res) => {
  try {
    const { gmail, password } = req.body;

    // Check required fields
    if (!gmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Gmail and password are required",
      });
    }

    // Find faculty by Gmail
    const faculty = await Faculty.findOne({
      gmail: gmail.toLowerCase().trim(),
    });

    // Faculty not found
    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: "Invalid Gmail or password",
      });
    }

    // Check active status
    if (!faculty.isActive) {
      return res.status(403).json({
        success: false,
        message: "Faculty account is inactive",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      faculty.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Gmail or password",
      });
    }

    // Login successful
    return res.status(200).json({
      success: true,
      message: "Faculty login successful",

      faculty: {
        name: faculty.name,
        gmail: faculty.gmail,

        // Database mein section hai,
        // frontend mein hum ise department bolenge
        department: faculty.section,

        subjects: faculty.subjects,

        isActive: faculty.isActive,
      },
    });
  } catch (error) {
    console.error("Faculty login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



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
      message: error.message,
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

    // Default password
    const password = "Student@123";

    // Hash password
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = await Faculty.create({
      facultyId,
      name,
      gmail,
      password: hashedPassword,
      section,
      subjects,
      isActive: true,
    });

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
      },
    });
  } catch (error) {
    console.error("Create faculty error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
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

    const Faculty = require("../models/Faculty");

    const faculty = await Faculty.findOne({ facultyId });

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

module.exports = {
  getAllFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  facultyLogin,
};
