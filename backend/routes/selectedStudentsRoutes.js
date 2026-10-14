
const express = require("express");
const { protect,authorize } = require("../middleware/authMiddleware");


const {
  saveSelectedStudents,
getSelectedStudents,
} = require("../controllers/seletedstudentsController");

const router = express.Router();

router.post("/", protect, authorize("Admin"), saveSelectedStudents);
router.get("/", protect, authorize("Admin"), getSelectedStudents);

module.exports = router;
