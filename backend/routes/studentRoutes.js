const express = require("express");
const { getStudents } = require("../controllers/StudentsController");
const { protect,authorize } = require("../middleware/authMiddleware");


const router = express.Router();

router.get("/", protect, authorize("Admin"), getStudents);

module.exports = router;