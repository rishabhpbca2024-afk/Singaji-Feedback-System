const express = require("express");
const { protect,authorize } = require("../middleware/authMiddleware");

const {
  createSchedule,
  getTodaySchedules,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const router = express.Router();

router.post("/create", protect, authorize("Admin","Faculty"), createSchedule);
router.get("/today", protect, authorize("Admin","Faculty"), getTodaySchedules);

router.put("/:id", protect, authorize("Admin","Faculty"), updateSchedule);

router.delete("/:id", protect, authorize("Admin","Faculty"), deleteSchedule);

module.exports = router;