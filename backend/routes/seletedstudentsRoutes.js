const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  saveSelectedStudents,
  getSelectedStudents,
  removeSelectedStudent,
} = require("../controllers/seletedstudentsController");

const router = express.Router();

router.post("/", protect, authorize("Admin"), saveSelectedStudents);
router.get("/", protect, authorize("Admin"), getSelectedStudents);
router.delete("/:id", protect, authorize("Admin"), removeSelectedStudent);

module.exports = router;
