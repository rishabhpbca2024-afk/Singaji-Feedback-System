import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiShare2, FiEdit2, FiTrash2 } from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";
import ssecLogo from "../assets/rename.png";
import "./FacultyDashboard.css";
import Modal from "../components/Modal.jsx";

const API_URL = import.meta.env.VITE_API_URL;


function LectureCell({ data }) {
  if (!data || !data.subject)
    return <td className="lecture-cell empty-cell">-</td>;

  return (
    <td className="lecture-cell">
      <div className="lecture-content">
        <span className="lecture-subject">{data.subject}</span>

        {data.faculty && (
          <span className="lecture-faculty">{data.faculty}</span>
        )}
      </div>
    </td>
  );
}

function FacultyDashboard() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("schedule");
  const [schedules, setSchedules] = useState([]);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [hasTodaySchedule, setHasTodaySchedule] = useState(false);

  const [scheduleTiming, setScheduleTiming] = useState({
    slot1: { startTime: "", endTime: "" },
    lunchBreak: { startTime: "", endTime: "" },
    slot2: { startTime: "", endTime: "" },
    teaBreak: { startTime: "", endTime: "" },
    slot3: { startTime: "", endTime: "" },
  });

  const [facultyList, setFacultyList] = useState([]);

  const [newSchedule, setNewSchedule] = useState({
    room: "",
    group: "",
    slot1Subject: "",
    slot1Faculty: "",
    slot1FacultyId: "",
    slot1StartTime: "",
    slot1EndTime: "",
    lunchStartTime: "",
    lunchEndTime: "",
    slot2Subject: "",
    slot2Faculty: "",
    slot2FacultyId: "",
    slot2StartTime: "",
    slot2EndTime: "",
    teaStartTime: "",
    teaEndTime: "",
    slot3Subject: "",
    slot3Faculty: "",
    slot3FacultyId: "",
    slot3StartTime: "",
    slot3EndTime: "",
  });

  const facultyName = user?.name || "";
  const authUser = JSON.parse(localStorage.getItem("authUser"));


  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
  const fetchFaculty = async () => {
    try {
      const response = await fetch(`${API_URL}/api/faculty`,
        
        {
        credentials: "include",
        });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Failed to fetch faculty:", data.message);
        return;
      }

      const allFaculty = Object.values(data.sections || {}).flat();

      setFacultyList(allFaculty);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    }
  };

  if (isAuthenticated) {
    fetchFaculty();
  }
}, [isAuthenticated]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // ---------------------------------------
  // GET TODAY'S SCHEDULES API
  // ---------------------------------------
  const fetchTodaySchedules = async () => {
    try {
      const department = user?.department;
      if (!department) return;

      const response = await fetch(
        `${API_URL}/api/schedules/today?department=${encodeURIComponent(
          department
        )}`,
         {
          credentials: "include",
  }
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch schedules:", data.message);
        return;
      }

      const fetchedSchedules = data.schedules || [];

      setSchedules(
        fetchedSchedules.map((schedule) => ({
          id: schedule._id,
          room: schedule.class,
          group: schedule.groups?.join(", ") || "",
          strength: schedule.strength,
          slot1: {
            subject: schedule.slot1?.subject || "",
            faculty: schedule.slot1?.facultyName || "",
            facultyId: schedule.slot1?.facultyId || "",
          },
          slot2: {
            subject: schedule.slot2?.subject || "",
            faculty: schedule.slot2?.facultyName || "",
            facultyId: schedule.slot2?.facultyId || "",
          },
          slot3: {
            subject: schedule.slot3?.subject || "",
            faculty: schedule.slot3?.facultyName || "",
            facultyId: schedule.slot3?.facultyId || "",
          },
        }))
      );

      setHasTodaySchedule(fetchedSchedules.length > 0);

      if (fetchedSchedules.length > 0) {
        const firstSchedule = fetchedSchedules[0];
        setScheduleTiming({
          slot1: {
            startTime: firstSchedule.slot1?.startTime || "",
            endTime: firstSchedule.slot1?.endTime || "",
          },
          lunchBreak: {
            startTime: firstSchedule.lunchBreak?.startTime || "",
            endTime: firstSchedule.lunchBreak?.endTime || "",
          },
          slot2: {
            startTime: firstSchedule.slot2?.startTime || "",
            endTime: firstSchedule.slot2?.endTime || "",
          },
          teaBreak: {
            startTime: firstSchedule.teaBreak?.startTime || "",
            endTime: firstSchedule.teaBreak?.endTime || "",
          },
          slot3: {
            startTime: firstSchedule.slot3?.startTime || "",
            endTime: firstSchedule.slot3?.endTime || "",
          },
        });
      } else {
        setScheduleTiming({
          slot1: { startTime: "", endTime: "" },
          lunchBreak: { startTime: "", endTime: "" },
          slot2: { startTime: "", endTime: "" },
          teaBreak: { startTime: "", endTime: "" },
          slot3: { startTime: "", endTime: "" },
        });
      }
    } catch (error) {
      console.error("Error fetching today's schedules:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.department) {
      fetchTodaySchedules();
    }
  }, [isAuthenticated, user?.department]);

  // ---------------------------------------
  // ADD SCHEDULE API
  // ---------------------------------------
  const handleAddScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!newSchedule.room || !newSchedule.group) {
      alert("Classroom and Group Name are required!");
      return;
    }

    if (!user?.department) {
      alert("Faculty department not found. Please login again.");
      return;
    }

    // First schedule of the day sets the common timing.
    if (
      !hasTodaySchedule &&
      (!newSchedule.slot1StartTime ||
        !newSchedule.slot1EndTime ||
        !newSchedule.lunchStartTime ||
        !newSchedule.lunchEndTime ||
        !newSchedule.slot2StartTime ||
        !newSchedule.slot2EndTime ||
        !newSchedule.teaStartTime ||
        !newSchedule.teaEndTime ||
        !newSchedule.slot3StartTime ||
        !newSchedule.slot3EndTime)
    ) {
      alert("Please enter all timings for the first schedule of the day.");
      return;
    }

    try {
      const groups = newSchedule.group
        .split(",")
        .map((group) => group.trim())
        .filter(Boolean);

      const scheduleData = {
        department: user.department,
        groups,
        class: newSchedule.room,

        slot1: {
          subject: newSchedule.slot1Subject,
          facultyId: newSchedule.slot1FacultyId,
          facultyName: newSchedule.slot1Faculty || facultyName,
          ...(hasTodaySchedule
            ? {}
            : {
                startTime: newSchedule.slot1StartTime,
                endTime: newSchedule.slot1EndTime,
              }),
        },

        ...(hasTodaySchedule
          ? {}
          : {
              lunchBreak: {
                startTime: newSchedule.lunchStartTime,
                endTime: newSchedule.lunchEndTime,
              },
            }),

        slot2: {
          subject: newSchedule.slot2Subject,
          facultyId: newSchedule.slot2FacultyId,
          facultyName: newSchedule.slot2Faculty || facultyName,
          ...(hasTodaySchedule
            ? {}
            : {
                startTime: newSchedule.slot2StartTime,
                endTime: newSchedule.slot2EndTime,
              }),
        },

        ...(hasTodaySchedule
          ? {}
          : {
              teaBreak: {
                startTime: newSchedule.teaStartTime,
                endTime: newSchedule.teaEndTime,
              },
            }),

        slot3: {
          subject: newSchedule.slot3Subject,
          facultyId: newSchedule.slot3FacultyId,
          facultyName: newSchedule.slot3Faculty || facultyName,
          ...(hasTodaySchedule
            ? {}
            : {
                startTime: newSchedule.slot3StartTime,
                endTime: newSchedule.slot3EndTime,
              }),
        },
      };

      const response = await fetch(
        `${API_URL}/api/schedules/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(scheduleData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create schedule.");
        return;
      }

      if (data.success) {
        await fetchTodaySchedules();
        setIsAddScheduleOpen(false);

        setNewSchedule({
          room: "",
          group: "",
          slot1Subject: "",
          slot1Faculty: "",
          slot1FacultyId: "",
          slot1StartTime: "",
          slot1EndTime: "",
          lunchStartTime: "",
          lunchEndTime: "",
          slot2Subject: "",
          slot2Faculty: "",
          slot2FacultyId: "",
          slot2StartTime: "",
          slot2EndTime: "",
          teaStartTime: "",
          teaEndTime: "",
          slot3Subject: "",
          slot3Faculty: "",
          slot3FacultyId: "",
          slot3StartTime: "",
          slot3EndTime: "",
        });

        showToast("New lecture schedule added successfully!");
      }
    } catch (error) {
      console.error("Error adding schedule:", error);
      alert("Something went wrong while creating schedule.");
    }
  };


  // ---------------------------------------
  // EDIT SCHEDULE API
  // ---------------------------------------
  const handleEditSchedule = (row) => {
    const originalSchedule = schedules.find(
      (schedule) => schedule.id === row.id
    );

    if (!originalSchedule?.id) {
      alert("Schedule ID not found.");
      return;
    }

    setEditingScheduleId(originalSchedule.id);

    setNewSchedule({
      room: originalSchedule.room || "",
      group: originalSchedule.group || "",
      slot1Subject: originalSchedule.slot1?.subject || "",
      slot1Faculty: originalSchedule.slot1?.faculty || "",
      slot1FacultyId: originalSchedule.slot1?.facultyId || "",
      slot1StartTime: scheduleTiming.slot1.startTime || "",
      slot1EndTime: scheduleTiming.slot1.endTime || "",
      lunchStartTime: scheduleTiming.lunchBreak.startTime || "",
      lunchEndTime: scheduleTiming.lunchBreak.endTime || "",
      slot2Subject: originalSchedule.slot2?.subject || "",
      slot2Faculty: originalSchedule.slot2?.faculty || "",
      slot2FacultyId: originalSchedule.slot2?.facultyId || "",
      slot2StartTime: scheduleTiming.slot2.startTime || "",
      slot2EndTime: scheduleTiming.slot2.endTime || "",
      teaStartTime: scheduleTiming.teaBreak.startTime || "",
      teaEndTime: scheduleTiming.teaBreak.endTime || "",
      slot3Subject: originalSchedule.slot3?.subject || "",
      slot3Faculty: originalSchedule.slot3?.faculty || "",
      slot3FacultyId: originalSchedule.slot3?.facultyId || "",
      slot3StartTime: scheduleTiming.slot3.startTime || "",
      slot3EndTime: scheduleTiming.slot3.endTime || "",
    });

    setIsEditScheduleOpen(true);
  };

  const handleEditScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!editingScheduleId) {
      alert("Schedule ID not found.");
      return;
    }

    if (!newSchedule.room || !newSchedule.group) {
      alert("Classroom and Group Name are required!");
      return;
    }

    if (!user?.department) {
      alert("Faculty department not found. Please login again.");
      return;
    }

    const groups = newSchedule.group
      .split(",")
      .map((group) => group.trim())
      .filter(Boolean);

    if (groups.length === 0) {
      alert("At least one group is required.");
      return;
    }

    try {
      const scheduleData = {
        department: user.department,
        groups,
        class: newSchedule.room,

        slot1: {
          subject: newSchedule.slot1Subject,
          facultyId: newSchedule.slot1FacultyId,
          facultyName: newSchedule.slot1Faculty || facultyName,
          startTime: newSchedule.slot1StartTime,
          endTime: newSchedule.slot1EndTime,
        },

        lunchBreak: {
          startTime: newSchedule.lunchStartTime,
          endTime: newSchedule.lunchEndTime,
        },

        slot2: {
          subject: newSchedule.slot2Subject,
          facultyId: newSchedule.slot2FacultyId,
          facultyName: newSchedule.slot2Faculty || facultyName,
          startTime: newSchedule.slot2StartTime,
          endTime: newSchedule.slot2EndTime,
        },

        teaBreak: {
          startTime: newSchedule.teaStartTime,
          endTime: newSchedule.teaEndTime,
        },

        slot3: {
          subject: newSchedule.slot3Subject,
          facultyId: newSchedule.slot3FacultyId,
          facultyName: newSchedule.slot3Faculty || facultyName,
          startTime: newSchedule.slot3StartTime,
          endTime: newSchedule.slot3EndTime,
        },
      };

      const response = await fetch(
        `${API_URL}/api/schedules/${editingScheduleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(scheduleData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update schedule.");
        return;
      }

      if (data.success) {
        await fetchTodaySchedules();

        setIsEditScheduleOpen(false);
        setEditingScheduleId(null);

        showToast("Schedule updated successfully!");

        setNewSchedule({
          room: "",
          group: "",
          slot1Subject: "",
          slot1Faculty: "",
          slot1FacultyId: "",
          slot1StartTime: "",
          slot1EndTime: "",
          lunchStartTime: "",
          lunchEndTime: "",
          slot2Subject: "",
          slot2Faculty: "",
          slot2FacultyId: "",
          slot2StartTime: "",
          slot2EndTime: "",
          teaStartTime: "",
          teaEndTime: "",
          slot3Subject: "",
          slot3Faculty: "",
          slot3FacultyId: "",
          slot3StartTime: "",
          slot3EndTime: "",
        });
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Something went wrong while updating schedule.");
    }
  };

  // ---------------------------------------
  // DELETE SCHEDULE API
  // ---------------------------------------
  const handleDeleteSchedule = async (row) => {
    if (!row?.id) {
      alert("Schedule ID not found.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.room}" (${row.group}) schedule?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/schedules/${row.id}`,
        {
          method: "DELETE",
         credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete schedule.");
        return;
      }

      if (data.success) {
        await fetchTodaySchedules();
        showToast("Schedule deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Something went wrong while deleting schedule.");
    }
  };

  // Date formatting for header
  const today = new Date();

  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  const formattedDate = today
    .toLocaleDateString("en-GB", options)
    .replace(/\//g, "-");

  const dayName = today.toLocaleDateString("en-US", {
    weekday: "long",
  });

  return (
    <div className="faculty-layout">

      {toastMessage && (
        <div className="faculty-toast">{toastMessage}</div>
      )}

      <div className="faculty-body">
        <main className="faculty-main-content">

          <div className="faculty-page-header">
            <div>
              <h1>Faculty Dashboard</h1>

              <p>
                View & manage your academic schedule and lecture
                details
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-add-schedule"
                onClick={() => setIsAddScheduleOpen(true)}
                style={{
                  background: "#166534",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiPlus style={{ marginRight: "6px" }} /> Add Schedule Row
              </button>

              <button
                className="btn-share-schedule"
                onClick={async () => {
                  let text =
                    `SANT SINGAJI INSTITUTE OF SCIENCE AND MANAGEMENT, SANDALPUR\n`;

                  text += `Date: ${formattedDate} | Day: ${dayName}\n`;

                  text += `====================================\n\n`;

                  schedules.forEach((row) => {
                    text += `Class: ${row.room} | Group: ${row.group} | Strength: ${row.strength}\n`;

                    text += `[${scheduleTiming.slot1.startTime || "--:--"} - ${
                      scheduleTiming.slot1.endTime || "--:--"
                    }]: ${row.slot1?.subject || "Empty"} (${
                      row.slot1?.faculty || "None"
                    })\n`;

                    text += `[${scheduleTiming.lunchBreak.startTime || "--:--"} - ${
                      scheduleTiming.lunchBreak.endTime || "--:--"
                    }]: LUNCH BREAK\n`;

                    text += `[${scheduleTiming.slot2.startTime || "--:--"} - ${
                      scheduleTiming.slot2.endTime || "--:--"
                    }]: ${row.slot2?.subject || "Empty"} (${
                      row.slot2?.faculty || "None"
                    })\n`;

                    text += `[${scheduleTiming.teaBreak.startTime || "--:--"} - ${
                      scheduleTiming.teaBreak.endTime || "--:--"
                    }]: TEA BREAK\n`;

                    text += `[${scheduleTiming.slot3.startTime || "--:--"} - ${
                      scheduleTiming.slot3.endTime || "--:--"
                    }]: ${row.slot3?.subject || "Empty"} (${
                      row.slot3?.faculty || "None"
                    })\n`;

                    text += `------------------------------------\n`;
                  });

                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: "Today Schedule",
                        text,
                      });
                    } catch (e) {}
                  } else {
                    await navigator.clipboard.writeText(text);

                    showToast(
                      "Complete schedule copied to clipboard for Teams/Group share!"
                    );
                  }
                }}
                style={{
                  background: "#ea580c",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiShare2 style={{ marginRight: "6px" }} /> Share Schedule on Teams
              </button>

              <div className="faculty-date-display">
                <strong>{formattedDate}</strong>
                <span>{dayName}</span>
              </div>
            </div>
          </div>

          {activeTab === "schedule" && (
            <div className="schedule-section">

              <div className="schedule-table-wrapper">
                <table className="academic-timetable">

                  <thead>
                    <tr>
                      <th className="th-sno">S.No.</th>

                      <th className="th-class">
                        Classes
                      </th>

                      <th className="th-group">
                        Groups Name
                      </th>

                      <th className="th-strength">
                        Strength
                      </th>

                      <th className="th-slot">
                        <div className="slot-title">
                          Slot 1
                        </div>

                        <div className="slot-time">
                          {scheduleTiming.slot1.startTime || "--:--"} to{" "}
                          {scheduleTiming.slot1.endTime || "--:--"}
                        </div>
                      </th>

                      <th className="th-break">
                        <div className="slot-title">
                          Lunch Break
                        </div>

                        <div className="slot-time">
                          {scheduleTiming.lunchBreak.startTime || "--:--"} to{" "}
                          {scheduleTiming.lunchBreak.endTime || "--:--"}
                        </div>
                      </th>

                      <th className="th-slot">
                        <div className="slot-title">
                          Slot 2
                        </div>

                        <div className="slot-time">
                          {scheduleTiming.slot2.startTime || "--:--"} to{" "}
                          {scheduleTiming.slot2.endTime || "--:--"}
                        </div>
                      </th>

                      <th className="th-break">
                        <div className="slot-title">
                          Tea Break
                        </div>

                        <div className="slot-time">
                          {scheduleTiming.teaBreak.startTime || "--:--"} to{" "}
                          {scheduleTiming.teaBreak.endTime || "--:--"}
                        </div>
                      </th>

                      <th className="th-slot">
                        <div className="slot-title">
                          Slot 3
                        </div>

                        <div className="slot-time">
                          {scheduleTiming.slot3.startTime || "--:--"} to{" "}
                          {scheduleTiming.slot3.endTime || "--:--"}
                        </div>
                      </th>

                      <th className="th-action">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {schedules.map((row, index) => (
                      <tr key={`${row.room}-${row.group}-${index}`}>

                        <td className="td-sno">
                          {index + 1}
                        </td>

                        <td className="td-class">
                          {row.room}
                        </td>

                        <td className="td-group">
                          {row.group}
                        </td>

                        <td className="td-strength">
                          {row.strength}
                        </td>

                        <LectureCell data={row.slot1} />

                        {index === 0 && (
                          <td
                            rowSpan={schedules.length}
                            className="break-cell lunch-break"
                          >
                            <div className="break-text">
                              LUNCH BREAK
                            </div>
                          </td>
                        )}

                        <LectureCell data={row.slot2} />

                        {index === 0 && (
                          <td
                            rowSpan={schedules.length}
                            className="break-cell tea-break"
                          >
                            <div className="break-text">
                              TEA BREAK
                            </div>
                          </td>
                        )}

                        <LectureCell data={row.slot3} />

                        <td className="td-action">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "10px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleEditSchedule(row)}
                              title="Edit Schedule"
                              style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "16px",
                                padding: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <FiEdit2 color="#2563eb" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(row)}
                              title="Delete Schedule"
                              style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "16px",
                                padding: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <FiTrash2 color="#ef4444" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          )}

          {/* ADD SCHEDULE MODAL */}

          <Modal
            isOpen={isAddScheduleOpen}
            onClose={() => setIsAddScheduleOpen(false)}
            title="Create New Timetable Schedule"
          >
            <form
              onSubmit={handleAddScheduleSubmit}
              className="modal-form"
            >

              {/* Classroom */}

              <div className="modal-form-group">
                <label>Classroom / Venue</label>

                <input
                  type="text"
                  placeholder="e.g. ITEG Lab 2 / F01"
                  value={newSchedule.room}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      room: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Group */}

              <div className="modal-form-group">
                <label>Group Name</label>

                <input
                  type="text"
                  placeholder="e.g. 1A or 1A, 1B"
                  value={newSchedule.group}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      group: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
              </div>

              {/* Slot 1 */}

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "12px",
                  marginTop: "12px",
                }}
              >
                <strong>Slot 1</strong>

                <div
                  className="modal-form-group"
                  style={{ marginTop: "6px" }}
                >
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSchedule.slot1Subject}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot1Subject: e.target.value,
                      })
                    }
                  />

                  <select
                    value={newSchedule.slot1FacultyId}
                    onChange={(e) => {
                      const selectedFaculty = facultyList.find(
                        (faculty) => faculty.facultyId === e.target.value
                      );

                      setNewSchedule({
                        ...newSchedule,
                        slot1FacultyId: selectedFaculty?.facultyId || "",
                        slot1Faculty: selectedFaculty?.name || "",
                      });
                    }}
                  >
                    <option value="">Select Faculty</option>

                    {facultyList
                      .filter((faculty) => faculty.section === user?.department)
                      .map((faculty) => (
                        <option
                          key={faculty.facultyId}
                          value={faculty.facultyId}
                        >
                          {faculty.name} ({faculty.facultyId})
                        </option>
                      ))}
                  </select>

                  {!hasTodaySchedule && (
                    <>
                  <label>Start Time</label>

                  <input
                    type="time"
                    value={newSchedule.slot1StartTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot1StartTime: e.target.value,
                      })
                    }
                  />

                  <label>End Time</label>

                  <input
                    type="time"
                    value={newSchedule.slot1EndTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot1EndTime: e.target.value,
                      })
                    }
                  />
                    </>
                  )}
                </div>
              </div>

              {/* Lunch Break */}

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "12px",
                  marginTop: "12px",
                }}
              >
                <strong>Lunch Break</strong>

                <div
                  className="modal-form-group"
                  style={{ marginTop: "6px" }}
                >
                  {!hasTodaySchedule && (
                    <>
                  <label>Start Time</label>

                  <input
                    type="time"
                    value={newSchedule.lunchStartTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        lunchStartTime: e.target.value,
                      })
                    }
                  />

                  <label>End Time</label>

                  <input
                    type="time"
                    value={newSchedule.lunchEndTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        lunchEndTime: e.target.value,
                      })
                    }
                  />
                    </>
                  )}
                </div>
              </div>

              {/* Slot 2 */}

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "12px",
                  marginTop: "12px",
                }}
              >
                <strong>Slot 2</strong>

                <div
                  className="modal-form-group"
                  style={{ marginTop: "6px" }}
                >
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSchedule.slot2Subject}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot2Subject: e.target.value,
                      })
                    }
                  />

                  <select
                    value={newSchedule.slot2FacultyId}
                    onChange={(e) => {
                      const selectedFaculty = facultyList.find(
                        (faculty) => faculty.facultyId === e.target.value
                      );

                      setNewSchedule({
                        ...newSchedule,
                        slot2FacultyId: selectedFaculty?.facultyId || "",
                        slot2Faculty: selectedFaculty?.name || "",
                      });
                    }}
                  >
                    <option value="">Select Faculty</option>

                    {facultyList
                      .filter((faculty) => faculty.section === user?.department)
                      .map((faculty) => (
                        <option
                          key={faculty.facultyId}
                          value={faculty.facultyId}
                        >
                          {faculty.name} ({faculty.facultyId})
                        </option>
                      ))}
                  </select>

                  {!hasTodaySchedule && (
                    <>
                  <label>Start Time</label>

                  <input
                    type="time"
                    value={newSchedule.slot2StartTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot2StartTime: e.target.value,
                      })
                    }
                  />

                  <label>End Time</label>

                  <input
                    type="time"
                    value={newSchedule.slot2EndTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot2EndTime: e.target.value,
                      })
                    }
                  />
                    </>
                  )}
                </div>
              </div>

              {/* Tea Break */}

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "12px",
                  marginTop: "12px",
                }}
              >
                <strong>Tea Break</strong>

                <div
                  className="modal-form-group"
                  style={{ marginTop: "6px" }}
                >
                  {!hasTodaySchedule && (
                    <>
                  <label>Start Time</label>

                  <input
                    type="time"
                    value={newSchedule.teaStartTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        teaStartTime: e.target.value,
                      })
                    }
                  />

                  <label>End Time</label>

                  <input
                    type="time"
                    value={newSchedule.teaEndTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        teaEndTime: e.target.value,
                      })
                    }
                  />
                    </>
                  )}
                </div>
              </div>

              {/* Slot 3 */}

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "12px",
                  marginTop: "12px",
                }}
              >
                <strong>Slot 3</strong>

                <div
                  className="modal-form-group"
                  style={{ marginTop: "6px" }}
                >
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSchedule.slot3Subject}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot3Subject: e.target.value,
                      })
                    }
                  />

                  <select
                    value={newSchedule.slot3FacultyId}
                    onChange={(e) => {
                      const selectedFaculty = facultyList.find(
                        (faculty) => faculty.facultyId === e.target.value
                      );

                      setNewSchedule({
                        ...newSchedule,
                        slot3FacultyId: selectedFaculty?.facultyId || "",
                        slot3Faculty: selectedFaculty?.name || "",
                      });
                    }}
                  >
                    <option value="">Select Faculty</option>

                    {facultyList
                      .filter((faculty) => faculty.section === user?.department)
                      .map((faculty) => (
                        <option
                          key={faculty.facultyId}
                          value={faculty.facultyId}
                        >
                          {faculty.name} ({faculty.facultyId})
                        </option>
                      ))}
                  </select>

                  {!hasTodaySchedule && (
                    <>
                  <label>Start Time</label>

                  <input
                    type="time"
                    value={newSchedule.slot3StartTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot3StartTime: e.target.value,
                      })
                    }
                  />

                  <label>End Time</label>

                  <input
                    type="time"
                    value={newSchedule.slot3EndTime}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        slot3EndTime: e.target.value,
                      })
                    }
                  />
                    </>
                  )}
                </div>
              </div>

              {/* Buttons */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setIsAddScheduleOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Schedule
                </button>

              </div>

            </form>
          </Modal>


          {/* EDIT SCHEDULE MODAL */}

          <Modal
            isOpen={isEditScheduleOpen}
            onClose={() => {
              setIsEditScheduleOpen(false);
              setEditingScheduleId(null);
            }}
            title="Edit Timetable Schedule"
          >
            <form onSubmit={handleEditScheduleSubmit} className="modal-form">
              <div className="modal-form-group">
                <label>Classroom / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. ITEG Lab 2 / F01"
                  value={newSchedule.room}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, room: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. 1A or 1A, 1B"
                  value={newSchedule.group}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, group: e.target.value.toUpperCase() })
                  }
                  required
                />
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px" }}>
                <strong>Slot 1</strong>
                <div className="modal-form-group" style={{ marginTop: "6px" }}>
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSchedule.slot1Subject}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot1Subject: e.target.value })
                    }
                  />
 <select
  value={newSchedule.slot1FacultyId}
  onChange={(e) => {
    const selectedFaculty = facultyList.find(
      (faculty) => faculty.facultyId === e.target.value
    );

    setNewSchedule({
      ...newSchedule,
      slot1FacultyId: selectedFaculty?.facultyId || "",
      slot1Faculty: selectedFaculty?.name || "",
    });
  }}
>
  <option value="">Select Faculty</option>

  {facultyList
    .filter((faculty) => faculty.section === user?.department)
    .map((faculty) => (
      <option
        key={faculty.facultyId}
        value={faculty.facultyId}
      >
        {faculty.name} ({faculty.facultyId})
      </option>
    ))}
</select>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.slot1StartTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot1StartTime: e.target.value })
                    }
                  />
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newSchedule.slot1EndTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot1EndTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px" }}>
                <strong>Lunch Break</strong>
                <div className="modal-form-group" style={{ marginTop: "6px" }}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.lunchStartTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, lunchStartTime: e.target.value })
                    }
                  />
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newSchedule.lunchEndTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, lunchEndTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px" }}>
                <strong>Slot 2</strong>
                <div className="modal-form-group" style={{ marginTop: "6px" }}>
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSchedule.slot2Subject}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot2Subject: e.target.value })
                    }
                  />
 <select
  value={newSchedule.slot2FacultyId}
  onChange={(e) => {
    const selectedFaculty = facultyList.find(
      (faculty) => faculty.facultyId === e.target.value
    );

    setNewSchedule({
      ...newSchedule,
      slot2FacultyId: selectedFaculty?.facultyId || "",
      slot2Faculty: selectedFaculty?.name || "",
    });
  }}
>
  <option value="">Select Faculty</option>

  {facultyList
    .filter((faculty) => faculty.section === user?.department)
    .map((faculty) => (
      <option
        key={faculty.facultyId}
        value={faculty.facultyId}
      >
        {faculty.name} ({faculty.facultyId})
      </option>
    ))}
</select>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.slot2StartTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot2StartTime: e.target.value })
                    }
                  />
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newSchedule.slot2EndTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot2EndTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px" }}>
                <strong>Tea Break</strong>
                <div className="modal-form-group" style={{ marginTop: "6px" }}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.teaStartTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, teaStartTime: e.target.value })
                    }
                  />
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newSchedule.teaEndTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, teaEndTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "12px" }}>
                <strong>Slot 3</strong>
                <div className="modal-form-group" style={{ marginTop: "6px" }}>
                  <input
                    type="text"
                    placeholder="Subject Name"
                    value={newSchedule.slot3Subject}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot3Subject: e.target.value })
                    }
                  />
<select
  value={newSchedule.slot3FacultyId}
  onChange={(e) => {
    const selectedFaculty = facultyList.find(
      (faculty) => faculty.facultyId === e.target.value
    );

    setNewSchedule({
      ...newSchedule,
      slot3FacultyId: selectedFaculty?.facultyId || "",
      slot3Faculty: selectedFaculty?.name || "",
    });
  }}
>
  <option value="">Select Faculty</option>

  {facultyList
    .filter((faculty) => faculty.section === user?.department)
    .map((faculty) => (
      <option
        key={faculty.facultyId}
        value={faculty.facultyId}
      >
        {faculty.name} ({faculty.facultyId})
      </option>
    ))}
</select>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.slot3StartTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot3StartTime: e.target.value })
                    }
                  />
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newSchedule.slot3EndTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, slot3EndTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditScheduleOpen(false);
                    setEditingScheduleId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Schedule
                </button>
              </div>
            </form>
          </Modal>

        </main>
      </div>
    </div>
  );
}

export default FacultyDashboard;