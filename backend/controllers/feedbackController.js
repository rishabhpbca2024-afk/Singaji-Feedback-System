
const Feedback = require("../models/Feedback");
const Schedule = require("../models/Schedule");
const SelectedStudents = require('../models/SeletedStudents');
const crypto = require("crypto");
const FeedbackToken = require("../models/FeedbackToken");
const Faculty = require("../models/Faculty");
const { safeErrorMessage } = require("../utils/errorHandler");

// SUBMIT FEEDBACK

const submitFeedback = async (req, res) => {
  try {
    const {
      token,
      metrics,
      remarks,
    } = req.body;

    console.log("======================================");
    console.log("FEEDBACK SUBMISSION REQUEST");
    console.log("Token received:", !!token);
    console.log("Metrics:", metrics);
    console.log("======================================");

    // =====================================================
    // 1. REQUIRED DATA VALIDATION
    // =====================================================

    if (!token || !metrics) {
      return res.status(400).json({
        success: false,
        message: "Feedback token and metrics are required.",
      });
    }

    // =====================================================
    // 2. HASH TOKEN
    // =====================================================

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // =====================================================
    // 3. FIND TOKEN
    // =====================================================

    const feedbackToken = await FeedbackToken.findOne({
      tokenHash,
    });

    if (!feedbackToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback link.",
      });
    }

    // =====================================================
    // 4. CHECK TOKEN EXPIRY
    // =====================================================

    if (feedbackToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This feedback link has expired.",
      });
    }

    // =====================================================
    // 5. CHECK TOKEN ALREADY USED
    // =====================================================

    if (feedbackToken.usedAt) {
      return res.status(400).json({
        success: false,
        message: "Feedback has already been submitted using this link.",
      });
    }

    // =====================================================
    // 6. GET TRUSTED DATA FROM TOKEN
    // =====================================================

    const normalizedGmail =
      feedbackToken.studentGmail
        .trim()
        .toLowerCase();

    const facultyId =
      feedbackToken.facultyId;

    const facultyName =
      feedbackToken.facultyName.trim();

    const subject =
      feedbackToken.subject.trim();

    const lectureTime =
      feedbackToken.lectureTime.trim();

    const lectureEndTime =
      feedbackToken.lectureEndTime.trim();

    // =====================================================
    // 7. VERIFY STUDENT IS STILL SELECTED
    // =====================================================

    const selectedStudent =
      await SelectedStudents.findOne({
        gmail: normalizedGmail,
      });

    if (!selectedStudent) {
      return res.status(400).json({
        success: false,
        message: "Student is not authorized for this feedback.",
      });
    }

    // =====================================================
    // 8. GET LEVEL + SECTION
    // =====================================================

 

const department =
  (feedbackToken.department || "").trim();

const studentLevel =
  feedbackToken.level ||
  selectedStudent.level ||
  "";

const studentSection =
  feedbackToken.section ||
  selectedStudent.section ||
  "";

    console.log("Student Gmail:", normalizedGmail);
    console.log("Student Level:", studentLevel);
    console.log("Student Section:", studentSection);
    console.log("Faculty:", facultyName);
    console.log("Subject:", subject);

    // =====================================================
    // 9. CHECK DUPLICATE FEEDBACK
    // =====================================================

    const existingFeedback =
      await Feedback.findOne({
        studentGmail: normalizedGmail,
        facultyId,
        facultyName,
        subject,
        lectureEndTime,
      });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message:
          "You have already submitted feedback for this lecture.",
      });
    }

    // =====================================================
    // 10. VALIDATE METRICS
    // =====================================================

    const requiredMetrics = [
      "Explanation",
      "Punctuality",
      "Engagement",
      "Resolution",
      "Overall",
    ];

    for (const metric of requiredMetrics) {
      const value = metrics[metric];

      if (
        value === undefined ||
        value === null ||
        Number(value) < 1 ||
        Number(value) > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid or missing rating for ${metric}.`,
        });
      }
    }

    // =====================================================
    // 11. SAVE FEEDBACK
    // =====================================================

    const feedback = await Feedback.create({
  studentGmail: normalizedGmail,

  level: studentLevel,

  // IMPORTANT:
  // Existing reporting code treats feedback.section
  // as department.
  section: department,

  facultyId,

  facultyName,

  subject,

  lectureTime,

  lectureEndTime,

  metrics: {
    Explanation: Number(metrics.Explanation),
    Punctuality: Number(metrics.Punctuality),
    Engagement: Number(metrics.Engagement),
    Resolution: Number(metrics.Resolution),
    Overall: Number(metrics.Overall),
  },

  remarks: remarks
    ? remarks.trim()
    : "",
});
    // =====================================================
    // 12. MARK TOKEN AS USED
    // =====================================================

    await FeedbackToken.findByIdAndUpdate(
      feedbackToken._id,
      {
        usedAt: new Date(),
      }
    );

    // =====================================================
    // 13. SUCCESS
    // =====================================================

    console.log(
      "Feedback successfully saved:",
      feedback._id
    );

    console.log(
      "Feedback token marked as used."
    );

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback,
    });

  } catch (error) {
    console.error(
      "Submit feedback error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to submit feedback"),
    });
  }
};

// =========================================================
// VERIFY FEEDBACK TOKEN
// GET /api/feedback/verify-token?token=...
// =========================================================
// =========================================================
// VERIFY FEEDBACK TOKEN
// GET /api/feedback/verify-token?token=...
// =========================================================

const verifyFeedbackToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Feedback token is required.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const feedbackToken =
      await FeedbackToken.findOne({
        tokenHash,
      });

    if (!feedbackToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback link.",
      });
    }

    if (feedbackToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This feedback link has expired.",
      });
    }

    if (feedbackToken.usedAt) {
      return res.status(400).json({
        success: false,
        message:
          "Feedback has already been submitted using this link.",
      });
    }

    const selectedStudent =
      await SelectedStudents.findOne({
        gmail: feedbackToken.studentGmail
          .trim()
          .toLowerCase(),
      });

    if (!selectedStudent) {
      return res.status(400).json({
        success: false,
        message:
          "Student is not authorized for this feedback.",
      });
    }

    return res.status(200).json({
      success: true,

      feedback: {
        department:
          feedbackToken.department,

        level:
          feedbackToken.level ||
          selectedStudent.level ||
          "",

        section:
          feedbackToken.section ||
          selectedStudent.section ||
          "",

        facultyId:
          feedbackToken.facultyId,

        facultyName:
          feedbackToken.facultyName,

        subject:
          feedbackToken.subject,

        lectureTime:
          feedbackToken.lectureTime,

        lectureEndTime:
          feedbackToken.lectureEndTime,
      },
    });

  } catch (error) {
    console.error(
      "Verify feedback token error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to verify feedback token"),
    });
  }
};
// =========================================================
// GET ALL FEEDBACK
// =========================================================
const getAllFeedback = async (req, res) => {
  try {
    const { date } = req.query;

    let matchStage = null;

    // =====================================================
    // DATE FILTER
    // =====================================================
    if (date) {
      const startDate = new Date(`${date}T00:00:00+05:30`);

      const endDate = new Date(`${date}T23:59:59.999+05:30`);

      matchStage = {
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const pipeline = [];

    // =====================================================
    // APPLY DATE FILTER
    // =====================================================
    if (matchStage) {
      pipeline.push({
        $match: matchStage,
      });
    }

    // =====================================================
    // GROUP FEEDBACK
    // =====================================================
    pipeline.push(
      {
        $group: {
          _id: {
            facultyId: "$facultyId",
            facultyName: "$facultyName",
            section: "$section",
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
                timezone: "Asia/Kolkata",
              },
            },
          },

          subjects: {
            $addToSet: "$subject",
          },

        overallRating: {
  $avg: {
    $divide: [
      {
        $add: [
          "$metrics.Explanation",
          "$metrics.Punctuality",
          "$metrics.Engagement",
          "$metrics.Resolution",
          "$metrics.Overall",
        ],
      },
      5,
    ],
  },
},

          totalFeedbacks: {
            $sum: 1,
          },

          latestDate: {
            $max: "$timestamp",
          },

          latestRemarks: {
            $last: "$remarks",
          },
        },
      },

      // ===================================================
      // PROJECT
      // ===================================================
      {
        $project: {
          _id: 0,

          facultyId: "$_id.facultyId",

          facultyName: "$_id.facultyName",

          department: "$_id.section",

          date: "$_id.date",

          subjects: 1,

          overallRating: {
            $round: ["$overallRating", 1],
          },

          totalFeedbacks: 1,

          comment: "$latestRemarks",

          latestDate: "$latestDate",
        },
      },

      // ===================================================
      // SORT
      // ===================================================
      {
        $sort: {
          latestDate: -1,
        },
      }
    );

    const feedbacks = await Feedback.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    console.error("Get all feedback error:", error);

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to fetch feedback"),
    });
  }
};

// =========================================================
// GET FEEDBACK BY FACULTY
// =========================================================
const getFeedbackByFaculty = async (
  req,
  res
) => {

  try {

  const { facultyId } = req.params;

const feedbacks = await Feedback.find({
  facultyId,
}).sort({
  timestamp: -1,
});


    const totalCount =
      feedbacks.length;


    let avgRating = 0;


    if (totalCount > 0) {

      const sum = feedbacks.reduce((acc, item) => {
  const explanation = Number(
    item.metrics?.Explanation || 0
  );

  const punctuality = Number(
    item.metrics?.Punctuality || 0
  );

  const engagement = Number(
    item.metrics?.Engagement || 0
  );

  const resolution = Number(
    item.metrics?.Resolution || 0
  );

  const overall = Number(
    item.metrics?.Overall || 0
  );

  const feedbackRating =
    (
      explanation +
      punctuality +
      engagement +
      resolution +
      overall
    ) / 5;

  return acc + feedbackRating;
}, 0);

avgRating = (
  sum / totalCount
).toFixed(1);
    }


    return res.status(200).json({

      success: true,

      count: totalCount,

      avgRating:
        Number(avgRating) || 0,

      feedbacks,
    });


  } catch (error) {

    console.error(
      "Get feedback by faculty error:",
      error
    );


    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to fetch feedback by faculty"),
    });
  }
};



// =========================================================
// SEND FEEDBACK INVITE
// =========================================================
const {
  sendFeedbackLinkEmail,
} = require("../utils/sendEmail");


const sendFeedbackInvite = async (req, res) => {
  try {
    const {
      studentEmail,
      department,
      level,
      section,
      facultyId,
      facultyName,
      subject,
      time,
      lectureEndTime,
    } = req.body || {};

    // =====================================================
    // VALIDATION (C-2)
    // =====================================================
    if (
      !studentEmail ||
      !department ||
      !level ||
      !section ||
      !subject
    ) {
      return res.status(400).json({
        success: false,
        message: "studentEmail, department, level, section and subject are required",
      });
    }

    // =====================================================
    // FACULTY ATTRIBUTION SCOPING (C-6)
    // =====================================================
    let effectiveFacultyId = facultyId;
    let effectiveFacultyName = facultyName;

    if (req.user?.role === "Faculty") {
      const facultyDoc = await Faculty.findById(req.user.userId)
        .select("facultyId name isActive")
        .lean();

      if (!facultyDoc || !facultyDoc.isActive) {
        return res.status(403).json({
          success: false,
          message: "Faculty account not found or inactive",
        });
      }

      effectiveFacultyId = facultyDoc.facultyId;
      effectiveFacultyName = facultyDoc.name;
    } else if (req.user?.role === "Admin") {
      if (!facultyId || !facultyName) {
        return res.status(400).json({
          success: false,
          message: "facultyId and facultyName are required for Admin invite",
        });
      }
    }

    // =====================================================
    // SEND EMAIL (C-2: EXACT 9 PARAMETERS IN ORDER)
    // =====================================================
    const result = await sendFeedbackLinkEmail(
      studentEmail.trim(),
      department.trim(),
      level.trim(),
      section.trim(),
      effectiveFacultyId.trim(),
      effectiveFacultyName.trim(),
      subject.trim(),
      time || "10:00 AM - 11:30 AM",
      lectureEndTime || ""
    );

    if (!result || !result.success) {
      return res.status(502).json({
        success: false,
        message: result?.message || "Failed to send feedback email",
        ...(process.env.NODE_ENV !== "production" && result?.error ? { error: result.error } : {}),
      });
    }

    return res.status(200).json({
      success: true,
      message: `Feedback invitation email dispatched to ${studentEmail}`,
    });
  } catch (error) {
    console.error("Send feedback invite error:", error);

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to process feedback invitation"),
    });
  }
};

/// =========================================================
// GET FACULTY HISTORY
// =========================================================
// GET /api/feedback/faculty-history/:facultyId
// =========================================================

const getFacultyHistory = async (req, res) => {
  try {
    const { facultyId } = req.params;

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: "facultyId is required.",
      });
    }

    // =====================================================
    // 1. GET ALL SCHEDULES
    // =====================================================

    const schedules = await Schedule.find({})
      .sort({ date: 1 })
      .lean();

    // =====================================================
    // 2. COUNT FACULTY LECTURES
    // =====================================================

    const facultyLectures = [];

    for (const schedule of schedules) {
      const slots = [
        {
          slotName: "slot1",
          slot: schedule.slot1,
        },
        {
          slotName: "slot2",
          slot: schedule.slot2,
        },
        {
          slotName: "slot3",
          slot: schedule.slot3,
        },
      ];

      for (const item of slots) {
        const slot = item.slot;

        if (!slot) {
          continue;
        }

        // Match faculty using facultyId
        if (
          String(slot.facultyId || "").trim() !==
          String(facultyId).trim()
        ) {
          continue;
        }

        if (!slot.startTime || !slot.endTime) {
          continue;
        }

        facultyLectures.push({
          scheduleId: schedule._id,
          slotName: item.slotName,

          date: schedule.date,

          department: schedule.department || "",

          className: schedule.class || "",

          groups: schedule.groups || [],

          subject: slot.subject || "",

          facultyId: slot.facultyId || "",

          facultyName: slot.facultyName || "",

          startTime: slot.startTime || "",

          endTime: slot.endTime || "",
        });
      }
    }

    // =====================================================
    // 3. GET ALL FEEDBACKS FOR FACULTY
    // =====================================================

    const facultyFeedbacks = await Feedback.find({
      facultyId: String(facultyId).trim(),
    })
      .sort({ timestamp: -1 })
      .lean();

    // =====================================================
    // 4. TOTAL FEEDBACKS
    // =====================================================

    const totalFeedbacks = facultyFeedbacks.length;

    // =====================================================
    // 5. OVERALL RATING
    // =====================================================

   const feedbackRatings = facultyFeedbacks
  .map((feedback) => {
    const explanation = Number(
      feedback.metrics?.Explanation
    );

    const punctuality = Number(
      feedback.metrics?.Punctuality
    );

    const engagement = Number(
      feedback.metrics?.Engagement
    );

    const resolution = Number(
      feedback.metrics?.Resolution
    );

    const overall = Number(
      feedback.metrics?.Overall
    );

    if (
      !Number.isFinite(explanation) ||
      !Number.isFinite(punctuality) ||
      !Number.isFinite(engagement) ||
      !Number.isFinite(resolution) ||
      !Number.isFinite(overall)
    ) {
      return null;
    }

    return (
      explanation +
      punctuality +
      engagement +
      resolution +
      overall
    ) / 5;
  })
  .filter(
    (rating) =>
      Number.isFinite(rating) &&
      rating >= 1 &&
      rating <= 5
  );

const averageScore =
  feedbackRatings.length > 0
    ? Number(
        (
          feedbackRatings.reduce(
            (sum, rating) => sum + rating,
            0
          ) / feedbackRatings.length
        ).toFixed(1)
      )
    : 0;

    // =====================================================
    // 6. QUESTION-WISE AVERAGES
    // =====================================================

    const getMetricAverage = (metricName) => {
      const values = facultyFeedbacks
        .map((feedback) =>
          Number(feedback.metrics?.[metricName])
        )
        .filter(
          (value) =>
            Number.isFinite(value) &&
            value >= 1 &&
            value <= 5
        );

      if (!values.length) {
        return 0;
      }

      return Number(
        (
          values.reduce(
            (sum, value) => sum + value,
            0
          ) / values.length
        ).toFixed(1)
      );
    };

    const parameterAverages = {
      Explanation: getMetricAverage("Explanation"),

      Punctuality: getMetricAverage("Punctuality"),

      Engagement: getMetricAverage("Engagement"),

      Resolution: getMetricAverage("Resolution"),

      Overall: getMetricAverage("Overall"),
    };

    // =====================================================
    // 7. RECENT COMMENTS
    // =====================================================

    const recentComments = facultyFeedbacks
      .filter(
        (feedback) =>
          feedback.remarks &&
          feedback.remarks.trim() !== ""
      )
      .slice(0, 10)
      .map((feedback) => ({
        date: feedback.timestamp,

        remark: feedback.remarks.trim(),

        level: feedback.level || "",

        rating:
          Number(
            feedback.metrics?.Overall
          ) || 0,
      }));

    // =====================================================
    // 8. FACULTY NAME + DEPARTMENT
    // =====================================================

    let facultyName = "";

    let department = "";

    if (facultyLectures.length > 0) {
      facultyName =
        facultyLectures[0].facultyName || "";

      department =
        facultyLectures[0].department || "";
    } else if (facultyFeedbacks.length > 0) {
      facultyName =
        facultyFeedbacks[0].facultyName || "";

      department =
        facultyFeedbacks[0].section || "";
    }

    // =====================================================
    // 9. RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      faculty: {
        facultyId: String(facultyId).trim(),
        name: facultyName,
        department,
      },

      totalLectures: facultyLectures.length,

      totalFeedbacks,

      averageScore,

      parameterAverages,

      recentComments,
    });
  } catch (error) {
    console.error(
      "Get faculty history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to fetch faculty history."),
    });
  }
};
// =========================================================
// GET FACULTY FEEDBACK VIEW
// =========================================================
// @route GET /api/feedback/faculty-view?facultyName=Anees%20sir&date=2026-09-07
// =========================================================
// GET FACULTY FEEDBACK VIEW
// =========================================================
// GET /api/feedback/faculty-view
// ?facultyName=Anees%20sir&date=2026-09-07
// =========================================================
// =========================================================
// GET FACULTY FEEDBACK VIEW
// =========================================================
// GET /api/feedback/faculty-view
// ?facultyId=ITEG-F003&date=2026-09-07
// =========================================================

const getFacultyFeedbackView = async (req, res) => {
  try {
    const { facultyId, date } = req.query;

    // -----------------------------------------------------
    // 1. VALIDATION
    // -----------------------------------------------------

    if (!facultyId || !date) {
      return res.status(400).json({
        success: false,
        message: "facultyId and date are required.",
      });
    }

    // -----------------------------------------------------
    // 2. DATE RANGE - INDIA TIME
    // -----------------------------------------------------

    const startOfDay = new Date(
      `${date}T00:00:00+05:30`
    );

    const endOfDay = new Date(
      `${date}T23:59:59.999+05:30`
    );

    // -----------------------------------------------------
    // 3. GET SCHEDULES FOR THIS DATE
    // -----------------------------------------------------

    const schedules = await Schedule.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).lean();

    // -----------------------------------------------------
    // 4. EXTRACT FACULTY LECTURE SLOTS
    // -----------------------------------------------------

    const facultyLectures = [];

    for (const schedule of schedules) {
      const normalizedDepartment = String(
        schedule.department || ""
      )
        .trim()
        .toLowerCase();

      const slots = [
        {
          slotName: "slot1",
          slotNumber: 1,
          slot: schedule.slot1,
        },
        {
          slotName: "slot2",
          slotNumber: 2,
          slot: schedule.slot2,
        },
        {
          slotName: "slot3",
          slotNumber: 3,
          slot: schedule.slot3,
        },
      ];

      const matchingSlots = slots.filter((item) => {
        const slot = item.slot;

        if (
          !slot ||
          !slot.subject ||
          !slot.facultyId ||
          !slot.startTime ||
          !slot.endTime
        ) {
          return false;
        }

        return (
          String(slot.facultyId).trim() ===
          String(facultyId).trim()
        );
      });

      for (const item of matchingSlots) {
        
       const actualStrength = await SelectedStudents.countDocuments({
  department: schedule.department,
  level: { $in: schedule.groups || [] },
});

        facultyLectures.push({
          scheduleId: schedule._id,
          slotName: item.slotName,
          slotNumber: item.slotNumber,

          department: normalizedDepartment,

          subject: item.slot.subject.trim(),

          facultyId: item.slot.facultyId.trim(),

          facultyName: item.slot.facultyName.trim(),

          startTime: item.slot.startTime.trim(),

          endTime: item.slot.endTime.trim(),

          className: schedule.class,

          groups: schedule.groups || [],

          strength: actualStrength, 
        });
      }
    }

    // -----------------------------------------------------
    // 5. SORT LECTURES BY START TIME
    // -----------------------------------------------------

    facultyLectures.sort(
      (a, b) =>
        convertTimeToMinutes(a.startTime) -
        convertTimeToMinutes(b.startTime)
    );

    // -----------------------------------------------------
    // 6. FIND NEXT SLOT START TIME
    // -----------------------------------------------------

    facultyLectures.forEach((lecture, index) => {
      const nextLecture =
        facultyLectures[index + 1];

      lecture.startMinutes =
        convertTimeToMinutes(
          lecture.startTime
        );

      lecture.endMinutes =
        convertTimeToMinutes(
          lecture.endTime
        );

      if (nextLecture) {
        nextLecture.startMinutes =
          convertTimeToMinutes(
            nextLecture.startTime
          );

        /*
         * Feedback for current lecture is accepted
         * only until 10 minutes before next lecture.
         */

        lecture.maxFeedbackMinutes =
          nextLecture.startMinutes - 10;
      } else {
        /*
         * Last lecture of the day.
         * No next lecture exists, so use end of day.
         */

        lecture.maxFeedbackMinutes =
          24 * 60;
      }
    });

    // -----------------------------------------------------
    // 7. GET FEEDBACKS FOR THIS FACULTY + DATE
    // -----------------------------------------------------

    const feedbacks = await Feedback.find({
      facultyId: String(facultyId).trim(),

      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).lean();

    // -----------------------------------------------------
    // 8. GROUP FEEDBACKS INTO CORRECT LECTURES
    // -----------------------------------------------------

    const lectureFeedbackMap = new Map();

    facultyLectures.forEach((lecture, index) => {
      lectureFeedbackMap.set(
        getLectureKey(lecture),
        {
          ...lecture,
          feedbacks: [],
          lectureIndex: index,
        }
      );
    });

    for (const feedback of feedbacks) {
      const feedbackDepartment = String(
        feedback.section || ""
      )
        .trim()
        .toLowerCase();

      const feedbackSubject = String(
        feedback.subject || ""
      )
        .trim()
        .toLowerCase();

      const feedbackFacultyId = String(
        feedback.facultyId || ""
      )
        .trim();

      const feedbackLectureEndTime = String(
        feedback.lectureEndTime || ""
      )
        .trim()
        .toLowerCase();

      const possibleLectures =
        facultyLectures.filter((lecture) => {
          const lectureDepartment = String(
            lecture.department || ""
          )
            .trim()
            .toLowerCase();

          const lectureFacultyId = String(
            lecture.facultyId || ""
          ).trim();

          const lectureEndTime = String(
            lecture.endTime || ""
          )
            .trim()
            .toLowerCase();

          const lectureGroups =
            (lecture.groups || []).map((group) =>
              String(group)
                .trim()
                .toLowerCase()
            );

          const feedbackLevel = String(
            feedback.level || ""
          )
            .trim()
            .toLowerCase();

          return (
            lectureDepartment ===
              feedbackDepartment &&
            lectureFacultyId ===
              feedbackFacultyId &&
            lectureGroups.includes(
              feedbackLevel
            ) &&
            lectureEndTime ===
              feedbackLectureEndTime
          );
        });

      // ---------------------------------------------------
      // Assign feedback to the correct lecture
      // ---------------------------------------------------

      if (possibleLectures.length > 0) {
        /*
         * Normally only one lecture should match because
         * the feedback submission time falls inside that
         * lecture's allowed feedback time window.
         *
         * If multiple lectures somehow match, choose the
         * latest-starting lecture.
         */

        const matchedLecture =
          possibleLectures.sort(
            (a, b) =>
              b.startMinutes -
              a.startMinutes
          )[0];

        const key =
          getLectureKey(matchedLecture);

        const target =
          lectureFeedbackMap.get(key);

        if (target) {
          target.feedbacks.push(feedback);
        }
      }
    }

    // -----------------------------------------------------
    // 9. ONLY LECTURES WITH SUBMITTED FEEDBACK
    // -----------------------------------------------------

    const lecturesWithFeedback =
      Array.from(
        lectureFeedbackMap.values()
      );

    // -----------------------------------------------------
    // 10. BUILD FINAL LECTURE DATA
    // -----------------------------------------------------

    const lectures =
      lecturesWithFeedback.map(
        (lecture, index) => {
          const lectureFeedbacks =
            lecture.feedbacks;

          const responses =
            lectureFeedbacks.length;

          // ----------------------------------------------
          // Overall average
          // ----------------------------------------------

       const overallAverage = average(
  lectureFeedbacks.map((item) => {
    const explanation = Number(
      item.metrics?.Explanation || 0
    );

    const punctuality = Number(
      item.metrics?.Punctuality || 0
    );

    const engagement = Number(
      item.metrics?.Engagement || 0
    );

    const resolution = Number(
      item.metrics?.Resolution || 0
    );

    const overall = Number(
      item.metrics?.Overall || 0
    );

    return (
      explanation +
      punctuality +
      engagement +
      resolution +
      overall
    ) / 5;
  })
);

          // ----------------------------------------------
          // Parameters
          // ----------------------------------------------

          const parameters = [
            {
              name: "Explanation",
              values:
                lectureFeedbacks.map(
                  (item) =>
                    Number(
                      item.metrics
                        ?.Explanation || 0
                    )
                ),
            },

            {
              name: "Punctuality",
              values:
                lectureFeedbacks.map(
                  (item) =>
                    Number(
                      item.metrics
                        ?.Punctuality || 0
                    )
                ),
            },

            {
              name: "Engagement",
              values:
                lectureFeedbacks.map(
                  (item) =>
                    Number(
                      item.metrics
                        ?.Engagement || 0
                    )
                ),
            },

            {
              name: "Resolution",
              values:
                lectureFeedbacks.map(
                  (item) =>
                    Number(
                      item.metrics
                        ?.Resolution || 0
                    )
                ),
            },

            {
              name: "Overall",
              values:
                lectureFeedbacks.map(
                  (item) =>
                    Number(
                      item.metrics?.Overall || 0
                    )
                ),
            },
          ].map((parameter) => ({
            name: parameter.name,

            ratings: [
              countRating(
                parameter.values,
                1
              ),

              countRating(
                parameter.values,
                2
              ),

              countRating(
                parameter.values,
                3
              ),

              countRating(
                parameter.values,
                4
              ),

              countRating(
                parameter.values,
                5
              ),
            ],

            avg: average(
              parameter.values
            ),
          }));

          // ----------------------------------------------
          // Remarks
          // ----------------------------------------------

          const remarks =
            lectureFeedbacks
              .map(
                (item) =>
                  item.remarks?.trim()
              )
              .filter(
                (remark) =>
                  remark &&
                  remark.length > 0 &&
                  remark !==
                    "Great lecture session."
              );

          return {
            lectureId:
              `${lecture.scheduleId}-${lecture.slotName}`,

            number:
              `Lecture ${index + 1}`,

            subject:
              lecture.subject,

            lectureTime:
              `${lecture.startTime} - ${lecture.endTime}`,

            className:
              lecture.className,

            groups:
              lecture.groups,

            strength:
              lecture.strength,

            responses,

            overallRating:
              overallAverage,

            parameters,

            remarks,
          };
        }
      );

    // -----------------------------------------------------
    // 11. FACULTY TOTALS
    // -----------------------------------------------------

    const totalResponses =
      lectures.reduce(
        (sum, lecture) =>
          sum + lecture.responses,
        0
      );

    const allOverallValues = [];

    lectures.forEach((lecture) => {
      for (
        let i = 0;
        i < lecture.responses;
        i++
      ) {
        allOverallValues.push(
          lecture.overallRating
        );
      }
    });

    const overallRating =
      totalResponses > 0
        ? Number(
            average(
              allOverallValues
            )
          )
        : 0;

    return res.status(200).json({
      success: true,

      faculty: {
        facultyId:
          String(facultyId).trim(),

        name:
          lectures[0]?.facultyName ||
          facultyLectures[0]
            ?.facultyName ||
          "",

        department:
          lectures[0]?.department ||
          facultyLectures[0]
            ?.department ||
          "",
      },

      date,

      totalResponses,

      overallRating,

      lectures,
    });
  } catch (error) {
    console.error(
      "Get faculty feedback view error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to fetch faculty feedback view"),
    });
  }
};
// =========================================================
// HELPER FUNCTIONS
// =========================================================

function convertTimeToMinutes(timeString) {
  if (!timeString) return 0;

  const time = timeString
    .trim()
    .toUpperCase();

  // Supports:
  // 09:02
  // 09:02 AM
  // 9:02 AM
  // 16:25

  const match = time.match(
    /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/
  );

  if (!match) {
    return 0;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3];

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
}


function getIndianTimeMinutes(dateValue) {
  const date = new Date(dateValue);

  const parts =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    ).formatToParts(date);

  const hour = Number(
    parts.find(
      (part) =>
        part.type === "hour"
    )?.value || 0
  );

  const minute = Number(
    parts.find(
      (part) =>
        part.type === "minute"
    )?.value || 0
  );

  return hour * 60 + minute;
}


function average(values) {
  const validValues =
    values.filter(
      (value) =>
        Number.isFinite(Number(value))
    );

  if (!validValues.length) {
    return 0;
  }

  const sum =
    validValues.reduce(
      (total, value) =>
        total + Number(value),
      0
    );

  return Number(
    (sum / validValues.length).toFixed(1)
  );
}


function countRating(values, rating) {
  return values.filter(
    (value) =>
      Number(value) === rating
  ).length;
}

function getLectureKey(lecture) {
  return [
    String(lecture.scheduleId),
    lecture.slotName,
    String(lecture.facultyId || "").trim(),
    lecture.endTime.trim().toLowerCase(),
  ].join("|");
}

// =========================================================
// GET FACULTY FEEDBACK (SELF FOR FACULTY, OR BY FACULTYID FOR ADMIN)
// =========================================================
// GET /api/feedback/my-feedback?date=2026-09-11
// =========================================================

const getMyFeedback = async (req, res) => {
  try {
    const { date, facultyId } = req.query;

    // -----------------------------------------------------
    // 1. DATE REQUIRED
    // -----------------------------------------------------

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required.",
      });
    }

    // -----------------------------------------------------
    // 2. GET TARGET FACULTY (M-2)
    // -----------------------------------------------------

    let faculty;

    if (req.user?.role === "Admin") {
      if (!facultyId) {
        return res.status(400).json({
          success: false,
          message: "facultyId query parameter is required for Admin.",
        });
      }
      faculty = await Faculty.findOne({
        facultyId: String(facultyId).trim(),
      }).lean();
    } else {
      faculty = await Faculty.findById(req.user.userId).lean();
    }

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    // -----------------------------------------------------
    // 3. DATE RANGE - INDIA TIME
    // -----------------------------------------------------

    const startOfDay = new Date(
      `${date}T00:00:00+05:30`
    );

    const endOfDay = new Date(
      `${date}T23:59:59.999+05:30`
    );

    // -----------------------------------------------------
    // 4. GET SCHEDULES FOR SELECTED DATE
    // -----------------------------------------------------

    const schedules = await Schedule.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).lean();

    // -----------------------------------------------------
    // 5. FIND LOGGED-IN FACULTY'S LECTURES
    // -----------------------------------------------------

    const facultyLectures = [];

    for (const schedule of schedules) {
      const slots = [
        {
          slotName: "slot1",
          slotNumber: 1,
          slot: schedule.slot1,
        },
        {
          slotName: "slot2",
          slotNumber: 2,
          slot: schedule.slot2,
        },
        {
          slotName: "slot3",
          slotNumber: 3,
          slot: schedule.slot3,
        },
      ];

      for (const item of slots) {
        const slot = item.slot;

        // -------------------------------------------------
        // INVALID SLOT
        // -------------------------------------------------

        if (
          !slot ||
          !slot.subject ||
          !slot.facultyId ||
          !slot.startTime ||
          !slot.endTime
        ) {
          continue;
        }

        // -------------------------------------------------
        // MATCH LOGGED-IN FACULTY USING FACULTY ID
        // -------------------------------------------------

        if (
          String(slot.facultyId).trim() !==
          String(faculty.facultyId).trim()
        ) {
          continue;
        }

        // -------------------------------------------------
        // STORE FACULTY LECTURE
        // -------------------------------------------------

        facultyLectures.push({
          scheduleId: schedule._id,

          slotName: item.slotName,

          slotNumber: item.slotNumber,

          subject: String(
            slot.subject || ""
          ).trim(),

          facultyId: String(
            slot.facultyId || ""
          ).trim(),

          facultyName: String(
            slot.facultyName || faculty.name || ""
          ).trim(),

          startTime: String(
            slot.startTime || ""
          ).trim(),

          endTime: String(
            slot.endTime || ""
          ).trim(),

          department: String(
            schedule.department || ""
          ).trim(),

          className: String(
            schedule.class || ""
          ).trim(),

          groups: Array.isArray(
            schedule.groups
          )
            ? schedule.groups
            : [],

          strength:
            Number(schedule.strength) || 0,
        });
      }
    }

    // -----------------------------------------------------
    // 6. GET FEEDBACKS FOR LOGGED-IN FACULTY + DATE
    // -----------------------------------------------------
    //
    // IMPORTANT:
    // Feedback lecture identification will NOT use
    // feedback.lectureTime.
    //
    // We use:
    // facultyId + subject + lectureEndTime
    // -----------------------------------------------------

    const feedbacks = await Feedback.find({
      facultyId: String(
        faculty.facultyId
      ).trim(),

      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .sort({
        timestamp: -1,
      })
      .lean();

    // -----------------------------------------------------
    // 7. MATCH FEEDBACK WITH LECTURES
    // -----------------------------------------------------

    const lectures = facultyLectures.map(
      (lecture) => {

        const lectureFeedbacks =
          feedbacks.filter(
            (feedback) => {

              // =========================================
              // FACULTY ID
              // =========================================

              const sameFaculty =
                String(
                  feedback.facultyId || ""
                ).trim() ===
                String(
                  lecture.facultyId || ""
                ).trim();

              // =========================================
              // SUBJECT
              // =========================================

              const feedbackSubject =
                String(
                  feedback.subject || ""
                )
                  .trim()
                  .toLowerCase();

              const lectureSubject =
                String(
                  lecture.subject || ""
                )
                  .trim()
                  .toLowerCase();

              const sameSubject =
                feedbackSubject ===
                lectureSubject;

              // =========================================
              // LECTURE END TIME
              // =========================================
              //
              // ONLY END TIME IS USED.
              //
              // feedback.lectureTime is NOT used.
              // =========================================

              const feedbackEndTime =
                String(
                  feedback.lectureEndTime || ""
                )
                  .trim()
                  .toLowerCase();

              const lectureEndTime =
                String(
                  lecture.endTime || ""
                )
                  .trim()
                  .toLowerCase();

              const sameEndTime =
                feedbackEndTime ===
                lectureEndTime;

              // =========================================
              // FINAL MATCH
              // =========================================

              return (
                sameFaculty &&
                sameSubject &&
                sameEndTime
              );
            }
          );

        // -------------------------------------------------
        // CALCULATE AVERAGE RATING
        // -------------------------------------------------

        const getAverage = (
          metricName
        ) => {

          const values =
            lectureFeedbacks
              .map(
                (feedback) =>
                  Number(
                    feedback.metrics?.[
                      metricName
                    ]
                  )
              )
              .filter(
                (value) =>
                  Number.isFinite(value) &&
                  value >= 1 &&
                  value <= 5
              );

          if (!values.length) {
            return 0;
          }

          const total =
            values.reduce(
              (sum, value) =>
                sum + value,
              0
            );

          return Number(
            (
              total / values.length
            ).toFixed(1)
          );
        };

        // -------------------------------------------------
        // RETURN LECTURE DATA
        // -------------------------------------------------

        return {
          scheduleId:
            lecture.scheduleId,

          slotName:
            lecture.slotName,

          slotNumber:
            lecture.slotNumber,

          subject:
            lecture.subject,

          startTime:
            lecture.startTime,

          endTime:
            lecture.endTime,

          department:
            lecture.department,

          className:
            lecture.className,

          groups:
            lecture.groups,

          strength:
            lecture.strength,

          // ---------------------------------------------
          // FEEDBACK COUNT
          // ---------------------------------------------

          feedbackCount:
            lectureFeedbacks.length,

          // ---------------------------------------------
          // RATINGS
          // ---------------------------------------------

          ratings: {
            Explanation:
              getAverage(
                "Explanation"
              ),

            Punctuality:
              getAverage(
                "Punctuality"
              ),

            Engagement:
              getAverage(
                "Engagement"
              ),

            Resolution:
              getAverage(
                "Resolution"
              ),

            Overall:
              getAverage(
                "Overall"
              ),
          },

          // ---------------------------------------------
          // INDIVIDUAL FEEDBACKS
          // ---------------------------------------------

          feedbacks:
            lectureFeedbacks.map(
              (feedback) => {

                return {
                  id:
                    feedback._id,

                  studentLevel:
                    feedback.level || "",

                  section:
                    feedback.section || "",

                  overall:
                    Number(
                      feedback.metrics?.Overall
                    ) || 0,

                  explanation:
                    Number(
                      feedback.metrics?.Explanation
                    ) || 0,

                  punctuality:
                    Number(
                      feedback.metrics?.Punctuality
                    ) || 0,

                  engagement:
                    Number(
                      feedback.metrics?.Engagement
                    ) || 0,

                  resolution:
                    Number(
                      feedback.metrics?.Resolution
                    ) || 0,

                  remarks:
                    feedback.remarks || "",

                  submittedAt:
                    feedback.timestamp,
                };
              }
            ),
        };
      }
    );

    // -----------------------------------------------------
    // 8. SORT LECTURES BY START TIME
    // -----------------------------------------------------

    lectures.sort(
      (a, b) =>
        convertTimeToMinutes(
          a.startTime
        ) -
        convertTimeToMinutes(
          b.startTime
        )
    );

    // -----------------------------------------------------
    // 9. TOTAL FEEDBACKS
    // -----------------------------------------------------

    const totalFeedbacks =
      lectures.reduce(
        (sum, lecture) =>
          sum +
          lecture.feedbackCount,
        0
      );

    // -----------------------------------------------------
    // 10. OVERALL RATING
    // -----------------------------------------------------

    const allOverallRatings = [];

    lectures.forEach(
      (lecture) => {

        lecture.feedbacks.forEach(
          (feedback) => {

            const rating =
              Number(
                feedback.overall
              );

            if (
              Number.isFinite(rating) &&
              rating >= 1 &&
              rating <= 5
            ) {
              allOverallRatings.push(
                rating
              );
            }
          }
        );
      }
    );

    const averageRating =
      allOverallRatings.length > 0
        ? Number(
            (
              allOverallRatings.reduce(
                (sum, rating) =>
                  sum + rating,
                0
              ) /
              allOverallRatings.length
            ).toFixed(1)
          )
        : 0;

    // -----------------------------------------------------
    // 11. RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,

      faculty: {
        facultyId:
          faculty.facultyId,

        name:
          faculty.name,

        gmail:
          faculty.gmail,

        department:
          faculty.section,
      },

      date,

      totalLectures:
        lectures.length,

      totalFeedbacks,

      averageRating,

      lectures,
    });

  } catch (error) {

    console.error(
      "Get my feedback error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to fetch your feedback."),
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================
module.exports = {
  submitFeedback,
  getAllFeedback,
  getFeedbackByFaculty,
  sendFeedbackInvite,
  getFacultyFeedbackView,
  getFacultyHistory,
  verifyFeedbackToken,
  getMyFeedback,
};
