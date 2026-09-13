const express = require('express');
const router = express.Router();
const { protect,authorize } = require("../middleware/authMiddleware");


const {
  getOverallReport,
  getFacultyReport,
  getCourseReport,
} = require('../controllers/reportController');

// GET /api/reports
router.get('/', protect, authorize("Admin"), getOverallReport);

// GET /api/reports/faculty/:facultyId
// router.get('/faculty/:facultyId', protect, authorize("Admin"), getFacultyReport);

// GET /api/reports/course/:courseId
// router.get('/course/:courseId', protect, authorize("Admin"), getCourseReport);

module.exports = router;
