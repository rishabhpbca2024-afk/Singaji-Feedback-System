const Schedule = require("../models/Schedule");
const Students = require("../models/Students");

// =====================================================
// Get today's start and end according to Indian time
// =====================================================
const getTodayRange = () => {
  const now = new Date();

  // Current UTC time
  const utcTime = now.getTime();

  // IST = UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;

  const istNow = new Date(utcTime + istOffset);

  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const day = istNow.getUTCDate();

  // Start of today in IST
  const startIST = new Date(
    Date.UTC(year, month, day, 0, 0, 0, 0) - istOffset
  );

  // Start of tomorrow in IST
  const endIST = new Date(
    Date.UTC(year, month, day + 1, 0, 0, 0, 0) - istOffset
  );

  return {
    start: startIST,
    end: endIST,
  };
};

// =====================================================
// Create Schedule
// =====================================================
const createSchedule = async (req, res) => {
  try {
    const {
      department,
      groups,
      class: className,
      slot1,
      lunchBreak,
      slot2,
      teaBreak,
      slot3,
    } = req.body;

    // =================================================
    // Basic validation
    // =================================================
    if (!department || !groups || !className) {
      return res.status(400).json({
        success: false,
        message: "Department, groups and class are required",
      });
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one group is required",
      });
    }

    // =================================================
    // Calculate total strength
    // =================================================
    const students = await Students.find({
      section: department,
      level: { $in: groups },
    });

    const strength = students.length;

    // =================================================
    // Find today's existing schedule
    // =================================================
    const { start, end } = getTodayRange();

    const existingSchedule = await Schedule.findOne({
      department,
      date: {
        $gte: start,
        $lt: end,
      },
    }).sort({ date: 1 });

    // =================================================
    // If today's schedule already exists
    // then reuse its timing
    // =================================================
    let finalSlot1;
    let finalLunchBreak;
    let finalSlot2;
    let finalTeaBreak;
    let finalSlot3;

    if (existingSchedule) {
      // -----------------------------------------------
      // Timing already exists for today
      // -----------------------------------------------

      finalSlot1 = {
        subject: slot1?.subject || "",
        facultyId: slot1?.facultyId || "",
        facultyName: slot1?.facultyName || "",
        startTime: existingSchedule.slot1?.startTime,
        endTime: existingSchedule.slot1?.endTime,
      };

      finalLunchBreak = {
        startTime: existingSchedule.lunchBreak?.startTime,
        endTime: existingSchedule.lunchBreak?.endTime,
      };

      finalSlot2 = {
        subject: slot2?.subject || "",
        facultyId: slot2?.facultyId || "",
        facultyName: slot2?.facultyName || "",
        startTime: existingSchedule.slot2?.startTime,
        endTime: existingSchedule.slot2?.endTime,
      };

      finalTeaBreak = {
        startTime: existingSchedule.teaBreak?.startTime,
        endTime: existingSchedule.teaBreak?.endTime,
      };

      finalSlot3 = {
        subject: slot3?.subject || "",
        facultyId: slot3?.facultyId || "",
        facultyName: slot3?.facultyName || "",
        startTime: existingSchedule.slot3?.startTime,
        endTime: existingSchedule.slot3?.endTime,
      };
    } else {
      // -----------------------------------------------
      // First schedule of the day
      // Timing is required
      // -----------------------------------------------

      if (
        !slot1?.startTime ||
        !slot1?.endTime ||
        !lunchBreak?.startTime ||
        !lunchBreak?.endTime ||
        !slot2?.startTime ||
        !slot2?.endTime ||
        !teaBreak?.startTime ||
        !teaBreak?.endTime ||
        !slot3?.startTime ||
        !slot3?.endTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "For the first schedule of the day, all timings are required",
        });
      }

      finalSlot1 = slot1;

      finalLunchBreak = lunchBreak;

      finalSlot2 = slot2;

      finalTeaBreak = teaBreak;

      finalSlot3 = slot3;
    }

    // =================================================
    // Create schedule
    // =================================================
    const schedule = await Schedule.create({
      department,
      groups,
      class: className,
      strength,

      slot1: finalSlot1,

      lunchBreak: finalLunchBreak,

      slot2: finalSlot2,

      teaBreak: finalTeaBreak,

      slot3: finalSlot3,
    });

    // =================================================
    // Response
    // =================================================
    return res.status(201).json({
      success: true,
      message: existingSchedule
        ? "Schedule created using today's existing timing"
        : "First schedule of the day created successfully",

      schedule,
    });
  } catch (error) {
    console.error("Create schedule error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Get Schedules by Date
// =====================================================
const getTodaySchedules = async (req, res) => {
  try {
    let start;
    let end;

    // =================================================
    // If date is provided → use selected date
    // Otherwise → use today's date
    // =================================================
    if (req.query.date) {
      const selectedDate = new Date(`${req.query.date}T00:00:00`);

      if (Number.isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }

      // IST = UTC + 5:30
      const istOffset = 5.5 * 60 * 60 * 1000;

      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();

      // Start of selected date in IST
      start = new Date(
        Date.UTC(year, month, day, 0, 0, 0, 0) - istOffset
      );

      // Start of next date in IST
      end = new Date(
        Date.UTC(year, month, day + 1, 0, 0, 0, 0) - istOffset
      );
    } else {
      // No date → today's schedules
      const todayRange = getTodayRange();

      start = todayRange.start;
      end = todayRange.end;
    }

    // =================================================
    // Build filter
    // =================================================
    const filter = {
      date: {
        $gte: start,
        $lt: end,
      },
    };

    // =================================================
    // Department filter
    // =================================================
    if (req.query.department) {
      filter.department = req.query.department;
    }

    // =================================================
    // Fetch schedules
    // =================================================
    const schedules = await Schedule.find(filter).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch schedules",
    });
  }
};


// =====================================================
// Update Schedule
// =====================================================
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      department,
      groups,
      class: className,
      slot1,
      lunchBreak,
      slot2,
      teaBreak,
      slot3,
    } = req.body;

    const existingSchedule = await Schedule.findById(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    if (!department || !groups || !className) {
      return res.status(400).json({
        success: false,
        message: "Department, groups and class are required",
      });
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one group is required",
      });
    }

    const students = await Students.find({
      section: department,
      level: { $in: groups },
    });

    const strength = students.length;

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      {
        department,
        groups,
        class: className,

        strength,

        slot1,
        lunchBreak,
        slot2,
        teaBreak,
        slot3,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Update schedule error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Delete Schedule
// =====================================================
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Schedule _id se hi delete hoga
    await Schedule.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Delete schedule error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSchedule,
  getTodaySchedules,
  updateSchedule,
  deleteSchedule,
};