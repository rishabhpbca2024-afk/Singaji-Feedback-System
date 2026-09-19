const express = require('express');
const { protect,authorize,allowOwnFacultyOrAdmin } = require("../middleware/authMiddleware");


const {
  submitFeedback,
  getFeedbackHistory,
  getAllFeedback,
  getFeedbackByFaculty,
  sendFeedbackInvite,
  getFacultyFeedbackView,
  getFacultyHistory,
  verifyFeedbackToken,
  getMyFeedback,
} = require('../controllers/feedbackController');

const router = express.Router();

router.get(
  "/verify-token",
  verifyFeedbackToken
);

router.post('/submit',  submitFeedback);

router.get('/all', protect, authorize("Admin"), getAllFeedback);

router.get('/faculty/:facultyId', protect, authorize("Admin"), getFeedbackByFaculty);

router.post('/send-invite', protect, authorize("Admin","Faculty"), sendFeedbackInvite);

router.get(
  "/faculty-view",
  protect,
  authorize("Admin", "Faculty"),
  allowOwnFacultyOrAdmin,
  getFacultyFeedbackView
);

router.get(
  "/my-feedback",
  protect,
  authorize("Admin","Faculty"),
  allowOwnFacultyOrAdmin,
  getMyFeedback
);

router.get(
  "/faculty-history/:facultyId",
  protect,
  authorize("Admin","Faculty"),
  allowOwnFacultyOrAdmin,
  getFacultyHistory
);


module.exports = router;