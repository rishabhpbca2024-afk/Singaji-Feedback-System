const Feedback = require('../models/Feedback');
const FeedbackSubmission = require('../models/FeedbackSubmission');
const SelectedStudents = require('../models/SeletedStudents');
const { hashStudentEmail } = require('../utils/hashUtils');

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

    // Get submitted student hashes from FeedbackSubmission (anonymous architecture)
    const submittedHashes = await FeedbackSubmission.distinct(
      'studentHash',
      dateFilter
    );

    // Map designated students' emails to their HMAC hashes
    const designatedHashes = new Set(
      designatedStudents.map((gmail) => hashStudentEmail(gmail))
    );

    const submittedDesignatedFromSubmissions = submittedHashes.filter((hash) =>
      designatedHashes.has(hash)
    );

    // Backward compatibility: also check legacy Feedback documents if any have studentGmail
    let submittedDesignatedFromLegacy = [];
    try {
      const legacySubmittedGmails = await Feedback.distinct('studentGmail', {
        ...dateFilter,
        studentGmail: { $exists: true, $ne: null },
      });
      submittedDesignatedFromLegacy = legacySubmittedGmails.filter((gmail) =>
        designatedStudents.includes(gmail)
      );
    } catch {
      // Legacy check safe fallback
    }

    const totalDesignatedStudents = designatedStudents.length;
    const totalSubmittedStudents = Math.max(
      submittedDesignatedFromSubmissions.length,
      submittedDesignatedFromLegacy.length
    );

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
            Number(overallResult[0]?.overallRating ?? 0).toFixed(1)
          ),

          totalSubmissions:
            overallResult[0]?.totalSubmissions ?? 0,

          lowScoreAlerts:
            overallResult[0]?.lowScoreAlerts ?? 0,
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
          Number(department?.overallRating ?? 0).toFixed(1)
        ),
        totalSubmissions: department?.totalSubmissions ?? 0,
        lowScoreAlerts: department?.lowScoreAlerts ?? 0,
      })),

      // Top Rated Faculties

      topRatedFaculty: topRatedFaculty.map((faculty) => ({
        facultyName: faculty._id?.facultyName,
        department: faculty._id?.section,
        subject: faculty._id?.subject,
        rating: Number(Number(faculty?.averageRating ?? 0).toFixed(1)),
        totalFeedbacks: faculty?.totalFeedbacks ?? 0,
      })),

      // low Rated Faculties

      lowScoreDetails: lowScoreAlerts.map((feedback) => ({
        facultyName: feedback.facultyName,
        department: feedback.section,
        subject: feedback.subject,
        rating: Number(Number(feedback?.calculatedRating ?? 0).toFixed(1)),
        reason: feedback.remarks,
        date: feedback.timestamp,
      })),
    });
  } catch (error) {
    console.error('Get overall report error:', error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Failed to fetch overall report',
    });
  }
};

module.exports = {
  getOverallReport,
  // getFacultyReport,
  // getCourseReport,
};