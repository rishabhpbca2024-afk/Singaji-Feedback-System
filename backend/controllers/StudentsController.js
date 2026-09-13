const Student = require("../models/Students");

const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("studentId name gmail section level")
      .sort({ section: 1, level: 1, studentId: 1 });

    const sections = {
      ITEG: {
        "1A": [],
        "1B": [],
        "1C": [],
        "2A": [],
        "2B": [],
        "2C": [],
      },
      MEG: {
        "1A": [],
        "1B": [],
        "1C": [],
        "2A": [],
        "2B": [],
        "2C": [],
      },
      BEG: {
        "1A": [],
        "1B": [],
        "1C": [],
        "2A": [],
        "2B": [],
        "2C": [],
      },
      "B.Tech": {
        "1A": [],
        "1B": [],
        "1C": [],
        "2A": [],
        "2B": [],
        "2C": [],
      },
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
      sections,
    });
  } catch (error) {
    console.error("Get students error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getStudents,
};