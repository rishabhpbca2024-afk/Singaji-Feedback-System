const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  getStudents,
  addStudent,
  uploadStudentsExcel,
  downloadExcelTemplate,
  deleteStudent,
} = require("../controllers/StudentsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Memory storage for multer so excel files are processed in-memory safely
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".xlsx", ".xls", ".csv"];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed."));
    }
  },
});

// Middleware to catch multer-specific errors (like file size or invalid file type)
const handleMulterUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Uploaded file is too large. Maximum size allowed is 10MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid file format.",
      });
    }
    next();
  });
};

// 1. Get all students grouped
router.get("/", protect, authorize("Admin"), getStudents);

// 2. Download sample excel template (Placed before /:studentId so it's not captured as a param)
router.get("/template", protect, authorize("Admin"), downloadExcelTemplate);

// 3. Add single student manually
router.post("/", protect, authorize("Admin"), addStudent);

// 4. Bulk upload students via Excel or CSV
router.post(
  "/upload-excel",
  protect,
  authorize("Admin"),
  handleMulterUpload,
  uploadStudentsExcel
);

// 5. Delete student
router.delete("/:studentId", protect, authorize("Admin"), deleteStudent);

module.exports = router;