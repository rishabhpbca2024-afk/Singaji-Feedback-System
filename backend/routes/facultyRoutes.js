const express = require("express");
const { protect , authorize,allowOwnFacultyOrAdmin} = require("../middleware/authMiddleware");


const {
  getAllFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require("../controllers/facultyController");

const router = express.Router();

router.get("/",protect,authorize("Admin","Faculty"),getAllFaculty);
router.post("/create", protect, authorize("Admin"), createFaculty);
router.put("/:facultyId", protect, authorize("Admin"), updateFaculty);
router.delete("/:facultyId", protect, authorize("Admin"), deleteFaculty);



module.exports = router;