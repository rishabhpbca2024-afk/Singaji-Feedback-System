const Schedule = require("../models/Schedule");
const Students = require("../models/Students");
const Faculty = require("../models/Faculty");
const { safeErrorMessage } = require("../utils/errorHandler");

const normalizeDept = (str) => String(str || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

// Helper to enforce department ownership for Faculty role (H-3)
const verifyFacultyDepartment = async (user, targetDepartment) => {
  if (!user) return false;
  if (user.role === "Admin") return true;
  if (user.role === "Faculty") {
    const faculty = await Faculty.findById(user.userId).select("section isActive").lean();
    if (!faculty || faculty.isActive === false) return false;
    return normalizeDept(faculty.section) === normalizeDept(targetDepartment);
  }
  return false;
};

// =====================================================
// Sanitization and Ownership Helpers
// =====================================================
const sanitizeBreak = (breakInput, existingBreak, forceExistingTiming = false) => {
  const b = breakInput || {};
  let startTime = "";
  if (forceExistingTiming && existingBreak?.startTime !== undefined) {
    startTime = existingBreak.startTime;
  } else if (typeof b.startTime === "string" && b.startTime.trim() !== "") {
    startTime = b.startTime.trim();
  } else if (existingBreak?.startTime !== undefined) {
    startTime = existingBreak.startTime;
  }

  let endTime = "";
  if (forceExistingTiming && existingBreak?.endTime !== undefined) {
    endTime = existingBreak.endTime;
  } else if (typeof b.endTime === "string" && b.endTime.trim() !== "") {
    endTime = b.endTime.trim();
  } else if (existingBreak?.endTime !== undefined) {
    endTime = existingBreak.endTime;
  }

  return { startTime, endTime };
};

const sanitizeAndValidateSlot = async (
  slotInput,
  existingScheduleSlot,
  forceExistingTiming,
  existingFeedbackEmailSent,
  user,
  effectiveDepartment,
  isSlot1 = false,
  existingFee = null
) => {
  const slot = slotInput || {};
  const subject = typeof slot.subject === "string" ? slot.subject.trim() : "";
  const rawFacultyId = typeof slot.facultyId === "string" ? slot.facultyId.trim() : "";

  let facultyId = "";
  let facultyName = "";

  if (rawFacultyId) {
    const facultyDoc = await Faculty.findOne({ facultyId: rawFacultyId })
      .select("facultyId name section isActive")
      .lean();

    if (!facultyDoc || facultyDoc.isActive === false) {
      const err = new Error(`Faculty '${rawFacultyId}' not found or inactive`);
      err.statusCode = 400;
      throw err;
    }

    if (user.role === "Faculty") {
      const isAuthorized = await verifyFacultyDepartment(user, facultyDoc.section);
      if (!isAuthorized) {
        const err = new Error(`You are not authorized to assign faculty '${rawFacultyId}' from department '${facultyDoc.section}'`);
        err.statusCode = 403;
        throw err;
      }
    }

    facultyId = facultyDoc.facultyId;
    facultyName = facultyDoc.name;
  } else {
    facultyName = typeof slot.facultyName === "string" ? slot.facultyName.trim() : "";
  }

  let startTime = "";
  if (forceExistingTiming && existingScheduleSlot?.startTime !== undefined) {
    startTime = existingScheduleSlot.startTime;
  } else if (typeof slot.startTime === "string" && slot.startTime.trim() !== "") {
    startTime = slot.startTime.trim();
  } else if (existingScheduleSlot?.startTime !== undefined) {
    startTime = existingScheduleSlot.startTime;
  }

  let endTime = "";
  if (forceExistingTiming && existingScheduleSlot?.endTime !== undefined) {
    endTime = existingScheduleSlot.endTime;
  } else if (typeof slot.endTime === "string" && slot.endTime.trim() !== "") {
    endTime = slot.endTime.trim();
  } else if (existingScheduleSlot?.endTime !== undefined) {
    endTime = existingScheduleSlot.endTime;
  }

  const sanitized = {
    subject,
    facultyId,
    facultyName,
    startTime,
    endTime,
    feedbackEmailSent: existingFeedbackEmailSent !== undefined ? Boolean(existingFeedbackEmailSent) : false,
  };

  if (isSlot1) {
    sanitized.fee = typeof slot.fee === "number" ? slot.fee : existingFee;
  }

  return sanitized;
};

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

    let effectiveDepartment = department;

    // Faculty ke case me department automatically login session se set karein
    if (req.user?.role === "Faculty") {
      const faculty = await Faculty.findById(req.user.userId).select("section isActive").lean();
      if (!faculty || faculty.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "Faculty account is inactive or not found.",
        });
      }
      effectiveDepartment = faculty.section;
    }

    // =================================================
    // Basic validation
    // =================================================
    if (!effectiveDepartment || !groups || !className) {
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
      section: effectiveDepartment,
      level: { $in: groups },
    });

    const strength = students.length;

    // =================================================
    // Find today's existing schedule
    // =================================================
    const { start, end } = getTodayRange();

    const existingSchedule = await Schedule.findOne({
      department: effectiveDepartment,
      date: {
        $gte: start,
        $lt: end,
      },
    }).sort({ date: 1 });

    const reuseTiming = Boolean(existingSchedule);

    if (!reuseTiming) {
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
    }

    const finalSlot1 = await sanitizeAndValidateSlot(
      slot1,
      existingSchedule?.slot1,
      reuseTiming,
      false, // feedbackEmailSent is always false on creation
      req.user,
      effectiveDepartment,
      true,
      null
    );

    const finalLunchBreak = sanitizeBreak(
      lunchBreak,
      existingSchedule?.lunchBreak,
      reuseTiming
    );

    const finalSlot2 = await sanitizeAndValidateSlot(
      slot2,
      existingSchedule?.slot2,
      reuseTiming,
      false,
      req.user,
      effectiveDepartment,
      false,
      null
    );

    const finalTeaBreak = sanitizeBreak(
      teaBreak,
      existingSchedule?.teaBreak,
      reuseTiming
    );

    const finalSlot3 = await sanitizeAndValidateSlot(
      slot3,
      existingSchedule?.slot3,
      reuseTiming,
      false,
      req.user,
      effectiveDepartment,
      false,
      null
    );

    // =================================================
    // Create schedule
    // =================================================
    const schedule = await Schedule.create({
      department: effectiveDepartment,
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

    if (error.statusCode && error.statusCode < 500) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to create schedule"),
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
    // Department ownership & filter
    // =================================================
    if (req.user?.role === "Faculty") {
      const faculty = await Faculty.findById(req.user.userId).select("section isActive").lean();
      if (!faculty || faculty.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "Faculty account is inactive or not found.",
        });
      }

      if (req.query.department) {
        const isAuthorized = await verifyFacultyDepartment(req.user, req.query.department);
        if (!isAuthorized) {
          return res.status(403).json({
            success: false,
            message: "You can only access schedules for your own department",
          });
        }
      }

      // Faculty queries are restricted to their own department
      filter.department = faculty.section;
    } else if (req.query.department) {
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
      message: safeErrorMessage(error, "Failed to fetch schedules"),
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

    let effectiveDepartment = department;

    if (req.user?.role === "Faculty") {
      const faculty = await Faculty.findById(req.user.userId).select("section isActive").lean();
      if (!faculty || faculty.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "Faculty account is inactive or not found.",
        });
      }

      if (normalizeDept(existingSchedule.department) !== normalizeDept(faculty.section)) {
        return res.status(403).json({
          success: false,
          message: "You can only update schedules for your own department",
        });
      }
      effectiveDepartment = faculty.section;
    }

    if (!effectiveDepartment || !groups || !className) {
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

    const isSlotModified = (newSlot, existingSlot) => {
      if (!existingSlot || !newSlot) return false;
      const normalize = (v) => String(v || "").trim();

      if (newSlot.subject !== undefined && normalize(newSlot.subject) !== normalize(existingSlot.subject)) return true;
      if (newSlot.facultyId !== undefined && normalize(newSlot.facultyId) !== normalize(existingSlot.facultyId)) return true;
      if (!newSlot.facultyId && newSlot.facultyName !== undefined && normalize(newSlot.facultyName) !== normalize(existingSlot.facultyName)) return true;
      if (newSlot.startTime !== undefined && normalize(newSlot.startTime) !== normalize(existingSlot.startTime)) return true;
      if (newSlot.endTime !== undefined && normalize(newSlot.endTime) !== normalize(existingSlot.endTime)) return true;
      return false;
    };

    // Prevent modifying slots whose feedback emails have already been dispatched
    if (existingSchedule.slot1?.feedbackEmailSent && isSlotModified(slot1, existingSchedule.slot1)) {
      return res.status(400).json({
        success: false,
        message: "Slot 1 cannot be modified because its feedback emails have already been sent to students.",
      });
    }

    if (existingSchedule.slot2?.feedbackEmailSent && isSlotModified(slot2, existingSchedule.slot2)) {
      return res.status(400).json({
        success: false,
        message: "Slot 2 cannot be modified because its feedback emails have already been sent to students.",
      });
    }

    if (existingSchedule.slot3?.feedbackEmailSent && isSlotModified(slot3, existingSchedule.slot3)) {
      return res.status(400).json({
        success: false,
        message: "Slot 3 cannot be modified because its feedback emails have already been sent to students.",
      });
    }

    const anyEmailSent = Boolean(
      existingSchedule.slot1?.feedbackEmailSent ||
      existingSchedule.slot2?.feedbackEmailSent ||
      existingSchedule.slot3?.feedbackEmailSent
    );

    if (anyEmailSent) {
      if (className && className.trim() !== (existingSchedule.class || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Class name cannot be modified after feedback emails have already been sent.",
        });
      }
      if (Array.isArray(groups)) {
        const sortedNew = [...groups].sort();
        const sortedOld = [...(existingSchedule.groups || [])].sort();
        if (JSON.stringify(sortedNew) !== JSON.stringify(sortedOld)) {
          return res.status(400).json({
            success: false,
            message: "Student groups cannot be modified after feedback emails have already been sent.",
          });
        }
      }
    }

    const students = await Students.find({
      section: effectiveDepartment,
      level: { $in: groups },
    });

    const strength = students.length;

    const finalSlot1 = await sanitizeAndValidateSlot(
      slot1,
      existingSchedule.slot1,
      false, // allow updated timings if provided, else keep existing
      existingSchedule.slot1?.feedbackEmailSent, // preserve existing feedbackEmailSent
      req.user,
      effectiveDepartment,
      true,
      existingSchedule.slot1?.fee ?? null
    );

    const finalLunchBreak = sanitizeBreak(
      lunchBreak,
      existingSchedule.lunchBreak,
      false
    );

    const finalSlot2 = await sanitizeAndValidateSlot(
      slot2,
      existingSchedule.slot2,
      false,
      existingSchedule.slot2?.feedbackEmailSent,
      req.user,
      effectiveDepartment,
      false,
      null
    );

    const finalTeaBreak = sanitizeBreak(
      teaBreak,
      existingSchedule.teaBreak,
      false
    );

    const finalSlot3 = await sanitizeAndValidateSlot(
      slot3,
      existingSchedule.slot3,
      false,
      existingSchedule.slot3?.feedbackEmailSent,
      req.user,
      effectiveDepartment,
      false,
      null
    );

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      {
        department: effectiveDepartment,
        groups,
        class: className,
        strength,
        slot1: finalSlot1,
        lunchBreak: finalLunchBreak,
        slot2: finalSlot2,
        teaBreak: finalTeaBreak,
        slot3: finalSlot3,
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

    if (error.statusCode && error.statusCode < 500) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to update schedule"),
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

    if (req.user?.role === "Faculty") {
      const isAuthorized = await verifyFacultyDepartment(req.user, schedule.department);
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: "You can only delete schedules for your own department",
        });
      }
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
      message: safeErrorMessage(error, "Failed to delete schedule"),
    });
  }
};

module.exports = {
  createSchedule,
  getTodaySchedules,
  updateSchedule,
  deleteSchedule,
};