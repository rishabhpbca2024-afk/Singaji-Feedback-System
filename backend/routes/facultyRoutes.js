const express = require("express");
const { protect, authorize, allowOwnFacultyOrAdmin } = require("../middleware/authMiddleware");

const {
  getAllFaculty,
  getFacultyDropdown,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  changePassword,
} = require("../controllers/facultyController");

const router = express.Router();

// Admin-only: Full faculty management list (M-6)
router.get("/", protect, authorize("Admin"), getAllFaculty);

// Scoped dropdown for schedule assignment: strictly limited fields and department-scoped (M-6)
router.get("/dropdown", protect, authorize("Admin", "Faculty"), getFacultyDropdown);

router.post("/create", protect, authorize("Admin"), createFaculty);
router.post("/change-password", protect, authorize("Faculty"), changePassword);
router.put("/:facultyId", protect, authorize("Admin"), updateFaculty);
router.delete("/:facultyId", protect, authorize("Admin"), deleteFaculty);

module.exports = router;