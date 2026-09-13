import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

import StudentDashboard from "../pages/StudentDashboard.jsx";
import FeedbackForm from "../pages/FeedbackForm.jsx";
import FeedbackHistory from "../pages/FeedbackHistory.jsx";

import FacultyDashboard from "../pages/FacultyDashboard.jsx";
import FacultySchedule from "../pages/FacultySchedule.jsx";
import FacultyHistory from "../pages/FacultyHistory.jsx";
import FacultyFeedbackView from "../pages/FacultyFeedbackView.jsx";
import FacultyProfile from "../pages/FacultyProfile.jsx";
import FacultyFeedback from "../pages/FacultyFeedback.jsx";

import AdminDashboard from "../pages/AdminDashboard.jsx";
import ManageStudents from "../pages/ManageStudents.jsx";
import ManageFaculty from "../pages/ManageFaculty.jsx";
import ManageQuestions from "../pages/ManageQuestions.jsx";
import Reports from "../pages/Reports.jsx";
import ManageCourses from "../pages/ManageCourses.jsx";
import ManageLectures from "../pages/ManageLectures.jsx";
import AdminFeedback from "../pages/AdminFeedback.jsx";

import Layout from "../components/Layout.jsx";
import FacultyLayout from "../components/FacultyLayout.jsx";


function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            DEFAULT
        ========================== */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />


        {/* =========================
            AUTH
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =========================
            STUDENT
        ========================== */}

        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="/student/feedback"
          element={<FeedbackForm />}
        />

        <Route
          path="/student/history"
          element={<FeedbackHistory />}
        />


        {/* =========================
            FACULTY
        ========================== */}

        <Route
          path="/faculty"
          element={<FacultyLayout />}
        >

          {/* Faculty Dashboard */}
          <Route
            path="dashboard"
            element={<FacultyDashboard />}
          />

          {/* Faculty Schedule */}
          <Route
            path="schedule"
            element={<FacultySchedule />}
          />

           {/* Faculty Feedback */}
            <Route
            path="feedback"
              element={<FacultyFeedback />}
            />


          {/* Faculty Profile */}
          <Route
            path="profile"
            element={<FacultyProfile />}
          />

        </Route>


        {/* =========================
            ADMIN
        ========================== */}

        <Route
          path="/admin"
          element={<Layout />}
        >

          {/* Dashboard */}

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />


          {/* Students */}

          <Route
            path="students"
            element={<ManageStudents />}
          />


          {/* Faculty */}

          <Route
            path="faculty"
            element={<ManageFaculty />}
          />

          <Route
            path="faculty/history/:facultyId"
            element={<FacultyHistory />}
          />


          {/* Questions */}

          <Route
            path="questions"
            element={<ManageQuestions />}
          />


          {/* Courses */}

          <Route
            path="courses"
            element={<ManageCourses />}
          />


          {/* Lectures */}

          <Route
            path="lectures"
            element={<ManageLectures />}
          />


          {/* Feedback */}

          <Route
            path="feedback"
            element={<AdminFeedback />}
          />


          {/* Reports */}

          <Route
            path="reports"
            element={<Reports />}
          />

        </Route>


        {/* =========================
            UNKNOWN ROUTE
        ========================== */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default AppRoutes; 