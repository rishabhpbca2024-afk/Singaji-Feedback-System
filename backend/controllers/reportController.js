const Feedback = require('../models/Feedback');
const SelectedStudents = require('../models/SeletedStudents');

// @desc    Get complete reports
// @route   GET /api/reports
const getOverallReport = async (req, res) => {
  try {
    // =========================================================
    // DATE FILTER
    // =========================================================
    const { date } = req.query;

    let dateFilter = {};

    if (date) {
      const startDate = new Date(`${date}T00:00:00+05:30`);
      const endDate = new Date(`${date}T23:59:59.999+05:30`);

      dateFilter = {
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // =========================================================
    // 1. OVERALL CAMPUS REPORT
    // =========================================================
    const designatedStudents = await SelectedStudents.distinct('gmail');

    const submittedStudents = await Feedback.distinct(
      'studentGmail',
      dateFilter
    );

    const submittedDesignatedStudents = submittedStudents.filter((gmail) =>
      designatedStudents.includes(gmail)
    );

    const totalDesignatedStudents = designatedStudents.length;
    const totalSubmittedStudents = submittedDesignatedStudents.length;

    const feedbackCompletion =
      totalDesignatedStudents > 0
        ? Math.round(
            (totalSubmittedStudents / totalDesignatedStudents) * 100
          )
        : 0;

    const overallResult = await Feedback.aggregate([
      // Date filter only when date is selected
      ...(date ? [{ $match: dateFilter }] : []),

      {
        $group: {
          _id: null,

          overallRating: {
  $avg: {
    $divide: [
      {
        $add: [
          '$metrics.Explanation',
          '$metrics.Punctuality',
          '$metrics.Engagement',
          '$metrics.Resolution',
          '$metrics.Overall',
        ],
      },
      5,
    ],
  },
},

totalSubmissions: {
  $sum: 1,
},

lowScoreAlerts: {
  $sum: {
    $cond: [
      {
        $lt: [
          {
            $divide: [
              {
                $add: [
                  '$metrics.Explanation',
                  '$metrics.Punctuality',
                  '$metrics.Engagement',
                  '$metrics.Resolution',
                  '$metrics.Overall',
                ],
              },
              5,
            ],
          },
          3.5,
        ],
      },
      1,
      0,
    ],
  },
},
        },
      },
    ]);

    // =========================================================
    // 2. DEPARTMENT-WISE REPORT
    // =========================================================

    const departmentResult = await Feedback.aggregate([
      // Date filter only when date is selected
      ...(date ? [{ $match: dateFilter }] : []),

      {
        $group: {
          _id: '$section',

         
          overallRating: {
  $avg: {
    $divide: [
      {
        $add: [
          '$metrics.Explanation',
          '$metrics.Punctuality',
          '$metrics.Engagement',
          '$metrics.Resolution',
          '$metrics.Overall',
        ],
      },
      5,
    ],
  },
},

totalSubmissions: {
  $sum: 1,
},

lowScoreAlerts: {
  $sum: {
    $cond: [
      {
        $lt: [
          {
            $divide: [
              {
                $add: [
                  '$metrics.Explanation',
                  '$metrics.Punctuality',
                  '$metrics.Engagement',
                  '$metrics.Resolution',
                  '$metrics.Overall',
                ],
              },
              5,
            ],
          },
          3.5,
        ],
      },
      1,
      0,
    ],
  },
},
        },
      },
      {
        $sort: {
          overallRating: -1,
        },
      },
    ]);

    // =========================================================
    // 3. TOP RATED FACULTY
    // =========================================================

    const topRatedFaculty = await Feedback.aggregate([
  // Date filter only when date is selected
  ...(date ? [{ $match: dateFilter }] : []),

  {
    $group: {
      _id: {
        facultyName: "$facultyName",
        section: "$section",
        subject: "$subject",
      },
averageRating: {
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
    },
  },

  // Only ratings >= 3.5 will be considered Top Rated
  {
    $match: {
      averageRating: {
        $gte: 3.5,
      },
    },
  },

  {
    $sort: {
      averageRating: -1,
    },
  },

  {
    $limit: 4,
  },
]);
    // =========================================================
    // 4. LOW SCORE ALERTS
    // =========================================================


const lowScoreAlerts = await Feedback.aggregate([
  ...(date ? [{ $match: dateFilter }] : []),

  {
    $addFields: {
      calculatedRating: {
        $divide: [
          {
            $add: [
              '$metrics.Explanation',
              '$metrics.Punctuality',
              '$metrics.Engagement',
              '$metrics.Resolution',
              '$metrics.Overall',
            ],
          },
          5,
        ],
      },
    },
  },

  {
    $match: {
      calculatedRating: {
        $lt: 3.5,
      },
    },
  },

  {
    $sort: {
      calculatedRating: 1,
    },
  },

  {
    $limit: 10,
  },
]);

    // =========================================================
    // 5. FINAL RESPONSE
    // =========================================================

    const overall =
      overallResult.length > 0
        ? {
            overallRating: Number(
              overallResult[0].overallRating.toFixed(1)
            ),

            totalSubmissions:
              overallResult[0].totalSubmissions,

            lowScoreAlerts:
              overallResult[0].lowScoreAlerts,
          }
        : {
            overallRating: 0,
            totalSubmissions: 0,
            lowScoreAlerts: 0,
          };

    return res.status(200).json({
      success: true,

      overall,

      campusFeedbackCompletion: {
        percentage: feedbackCompletion,
        submitted: totalSubmittedStudents,
        designated: totalDesignatedStudents,
      },

      /// Department Wise

      departments: departmentResult.map((department) => ({
        department: department._id,
        overallRating: Number(
          department.overallRating.toFixed(1)
        ),
        totalSubmissions: department.totalSubmissions,
        lowScoreAlerts: department.lowScoreAlerts,
      })),

      // Top Rated Faculties

      topRatedFaculty: topRatedFaculty.map((faculty) => ({
        facultyName: faculty._id.facultyName,
        department: faculty._id.section,
        subject: faculty._id.subject,
        rating: Number(faculty.averageRating.toFixed(1)),
        totalFeedbacks: faculty.totalFeedbacks,
      })),

      // low Rated Faculties

      lowScoreDetails: lowScoreAlerts.map((feedback) => ({
        facultyName: feedback.facultyName,
        department: feedback.section,
        subject: feedback.subject,
        rating: Number(feedback.calculatedRating.toFixed(1)),
        reason: feedback.remarks,
        date: feedback.timestamp,
      })),
    });
  } catch (error) {
    console.error('Get overall report error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getOverallReport,
  // getFacultyReport,
  // getCourseReport,
};