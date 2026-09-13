import { useEffect, useState } from "react";
import { FiCalendar, FiClock, FiUser, FiHome, FiMapPin, FiTrash2 } from "react-icons/fi";
import Modal from "../components/Modal.jsx";
import "./ManageLectures.css";

const API_URL = import.meta.env.VITE_API_URL;

function ManageLectures() {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
  new Date().toLocaleDateString("en-CA")
);

  const departments = ["ITEG", "MEG", "BEG", "B.Tech"];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newLecture, setNewLecture] = useState({
    subject: "",
    faculty: "",
    department: "ITEG",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM - 11:00 AM",
    room: "Lab-1",
    status: "Scheduled",
  });

  const [activeLecture, setActiveLecture] = useState(null);
   const authUser = JSON.parse(localStorage.getItem("authUser"));
  // ---------------------------------------
  // GET TODAY'S SCHEDULES FROM DATABASE
  // ---------------------------------------
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/schedules/today?date=${selectedDate}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch schedules");
        }

        const schedules = data.schedules || data.data || [];

        const lectureList = [];

        schedules.forEach((schedule) => {
          const slots = [
            {
              slot: schedule.slot1,
              slotNumber: 1,
            },
            {
              slot: schedule.slot2,
              slotNumber: 2,
            },
            {
              slot: schedule.slot3,
              slotNumber: 3,
            },
          ];

          slots.forEach(({ slot }) => {
            if (!slot?.subject) return;

            lectureList.push({
              id: `${schedule._id}-${slot.startTime}-${slot.subject}`,
              subject: slot.subject,
              faculty: slot.facultyName || "Faculty not assigned",
              department: schedule.department,
              date: schedule.date,
              time:
                slot.startTime && slot.endTime
                  ? `${slot.startTime} - ${slot.endTime}`
                  : "Time not available",
              room: schedule.class || "Room not assigned",
              status: getLectureStatus(
                schedule.date,
                slot.startTime,
                slot.endTime
              ),
            });
          });
        });

        setLectures(lectureList);
      } catch (error) {
        console.error("Error fetching today's lectures:", error);
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, [selectedDate]);

  // ---------------------------------------
  // LECTURE STATUS
  // ---------------------------------------
  const getLectureStatus = (date, startTime, endTime) => {
    if (!startTime || !endTime) return "Scheduled";

    const now = new Date();

    const scheduleDate = new Date(date);

    if (Number.isNaN(scheduleDate.getTime())) {
      return "Scheduled";
    }

    const datePart = scheduleDate.toLocaleDateString("en-CA");

    const parseTime = (timeString) => {
      const match = timeString.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
      );

      if (!match) return null;

      let hours = Number(match[1]);
      const minutes = Number(match[2]);
      const period = match[3].toUpperCase();

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      const result = new Date(`${datePart}T00:00:00`);
      result.setHours(hours, minutes, 0, 0);

      return result;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (!start || !end) return "Scheduled";

    if (now < start) return "Scheduled";
    if (now >= start && now <= end) return "In Progress";
    return "Completed";
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-CA");
  };

  // ---------------------------------------
  // ADD LECTURE
  // ---------------------------------------
  const handleAddLecture = (e) => {
    e.preventDefault();

    if (!newLecture.subject || !newLecture.faculty || !newLecture.room) {
      return;
    }

    // Schedule creation is handled from Faculty Dashboard.
    // Admin page only displays database schedules here.
    setIsAddModalOpen(false);
  };

  // ---------------------------------------
  // EDIT LECTURE
  // ---------------------------------------
  const handleOpenEdit = (lec) => {
    setActiveLecture({ ...lec });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();

    // Schedule updates should be handled through the Schedule API.
    setIsEditModalOpen(false);
    setActiveLecture(null);
  };

  // ---------------------------------------
  // DELETE LECTURE
  // ---------------------------------------
  const handleOpenDelete = (lec) => {
    setActiveLecture(lec);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    // Schedule deletion API can be connected here when admin
    // delete functionality is required.
    setIsDeleteModalOpen(false);
    setActiveLecture(null);
  };

  return (
    <div className="manage-lectures-page">
     <div className="lectures-header">
  <div>
    <h1>Manage Lectures</h1>
    <p>
      Schedule, manage classrooms, and track active lecture status.
    </p>
  </div>

  <div className="lecture-date-filter">
    <label htmlFor="lecture-date">Select Date</label>

    <input
      id="lecture-date"
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
  </div>
</div>

      <div className="lectures-list">
        {loading ? (
          <div className="no-data-box">Loading lectures...</div>
        ) : lectures.length > 0 ? (
          lectures.map((lec) => (
            <div key={lec.id} className="lecture-row-card">
              <div className="lecture-main-info">
                <div className="lecture-time-badge">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <FiCalendar /> {formatDate(lec.date)}
                  </span>
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <FiClock /> {lec.time}
                  </strong>
                </div>

                <div className="lecture-details">
                  <h3>{lec.subject}</h3>

                  <p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <FiUser /> <strong>{lec.faculty}</strong>
                    </span>
                    {" • "}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <FiHome /> {lec.department} Department
                    </span>
                  </p>

                  <span className="room-tag">
                    <FiMapPin style={{ marginRight: "5px", verticalAlign: "-2px" }} />
                    Room / Venue: {lec.room}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data-box">
            No lectures scheduled for {formatDate(selectedDate)}.
        </div>
        )}
      </div>

      {/* ADD LECTURE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule New Lecture"
      >
        <form onSubmit={handleAddLecture} className="lecture-modal-form">
          <div className="modal-form-group">
            <label>Subject / Topic</label>
            <input
              type="text"
              placeholder="e.g. Java OOP Concepts"
              value={newLecture.subject}
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  subject: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Faculty Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Rahul Sharma"
              value={newLecture.faculty}
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  faculty: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Department</label>
            <select
              value={newLecture.department}
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  department: e.target.value,
                })
              }
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-form-group">
            <label>Date</label>
            <input
              type="date"
              value={newLecture.date}
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  date: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Time Slot</label>
            <input
              type="text"
              placeholder="e.g. 10:00 AM - 11:30 AM"
              value={newLecture.time}
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  time: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Room / Venue</label>
            <input
              type="text"
              placeholder="e.g. Lab-3"
              value={newLecture.room}
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  room: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Status</label>
            <select
              value={newLecture.status}
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  status: e.target.value,
                })
              }
            >
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>

            <button type="submit" className="btn-primary">
              Schedule Lecture
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT LECTURE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Scheduled Lecture"
      >
        {activeLecture && (
          <form onSubmit={handleSaveEdit} className="lecture-modal-form">
            <div className="modal-form-group">
              <label>Subject / Topic</label>
              <input
                type="text"
                value={activeLecture.subject}
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    subject: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Faculty Name</label>
              <input
                type="text"
                value={activeLecture.faculty}
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    faculty: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Department</label>
              <select
                value={activeLecture.department}
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    department: e.target.value,
                  })
                }
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label>Date</label>
              <input
                type="date"
                value={activeLecture.date}
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    date: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Time Slot</label>
              <input
                type="text"
                value={activeLecture.time}
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    time: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Room / Venue</label>
              <input
                type="text"
                value={activeLecture.room}
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    room: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Status</label>
              <select
                value={activeLecture.status}
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    status: e.target.value,
                  })
                }
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>

              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Lecture"
      >
        <div className="confirm-delete-body">
          <span className="confirm-icon">
            <FiTrash2 />
          </span>

          <p>
            Are you sure you want to cancel and delete the lecture{" "}
            <strong>{activeLecture?.subject}</strong>?
            <br />
            This action cannot be undone.
          </p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Keep Lecture
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={handleConfirmDelete}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ManageLectures;
