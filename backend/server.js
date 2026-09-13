const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const questionRoutes = require("./routes/questionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const studentsRoutes = require("./routes/studentRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const selectedStudentsRoutes = require("./routes/seletedstudentsRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");

// Feedback Email Scheduler
const { startEmailScheduler } = require("./utils/emailScheduler");

const {
  apiLimiter,
  loginLimiter,
} = require("./middleware/Ratelimiter");

const app = express();

// ==========================================
// TRUST RENDER PROXY
// ==========================================

app.set("trust proxy", 1);

// ==========================================
// ALLOWED FRONTEND ORIGINS
// ==========================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
   "https://singaji-feedback-system.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// ==========================================
// BODY PARSERS
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);

// ==========================================
// COOKIE PARSER
// ==========================================

app.use(cookieParser());

// ==========================================
// DATABASE
// ==========================================

connectDB();

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Singaji Feedback Backend is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/feedback", feedbackRoutes);

app.use("/api/questions", questionRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/students", studentsRoutes);

app.use("/api/faculty", facultyRoutes);

app.use("/api/selected-students", selectedStudentsRoutes);

app.use("/api/schedules", scheduleRoutes);

// ==========================================
// START EMAIL SCHEDULER
// ==========================================

startEmailScheduler();

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
  console.error("Server Error:", error.message);

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS origin is not allowed",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});