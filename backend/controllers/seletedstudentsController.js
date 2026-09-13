const SelectedStudents = require("../models/SeletedStudents");

const saveSelectedStudents = async (req, res) => {
  try {
    const { department, level, students } = req.body;

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

    // Same department + level ke purane students remove
    await SelectedStudents.deleteMany({
      department,
      level,
    });

    // New 10 students ko separate documents mein save
    const selectedStudents = students.map((student) => ({
      department,
      level,
      name: student.name,
      gmail: student.gmail,
    }));

    const savedStudents = await SelectedStudents.insertMany(
      selectedStudents
    );

    res.status(200).json({
      success: true,
      message: "10 students selected successfully",
      data: savedStudents,
    });
  } catch (error) {
    console.error("Error selecting students:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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
      department,
      level,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching selected students:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  saveSelectedStudents,
  getSelectedStudents,
};