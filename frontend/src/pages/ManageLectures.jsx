import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiTrash2,
  FiSearch,
  FiEdit2,
} from "react-icons/fi";
import Modal from "../components/Modal.jsx";
import "./ManageLectures.css";

const API_URL = import.meta.env.VITE_API_URL;

function LectureCell({ data }) {
  if (!data || !data.subject) {
    return <td className="lecture-cell empty-cell">-</td>;
  }

  return (
    <td className="lecture-cell">
      <div className="lecture-content">
        <span className="lecture-subject">{data.subject}</span>

        {data.facultyName && (
          <span className="lecture-faculty">
            {data.facultyName}
          </span>
        )}
      </div>
    </td>
  );
}

function ManageLectures() {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // SELECTED DATE
  // ==========================================

  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  // ==== Faculty list state ====
  const [allFaculty, setAllFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState(null);

  // ==== Faculty filter options ====
  const [facultyFilter, setFacultyFilter] = useState('all'); // 'all' | 'has' | 'none'


  // ==========================================
  // FACULTY SEARCH
  // ==========================================

  const [searchFaculty, setSearchFaculty] = useState("");

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  const departments = [
    "ITEG",
    "MEG",
    "BEG",
    "B.Tech",
  ];

  // ==========================================
  // MODALS
  // ==========================================

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ==========================================
  // NEW LECTURE
  // ==========================================

  const [newLecture, setNewLecture] = useState({
    subject: "",
    faculty: "",
    department: "ITEG",
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM - 11:00 AM",
    room: "Lab-1",
    status: "Scheduled",
  });

  // ==========================================
  // ACTIVE LECTURE
  // ==========================================

  const [activeLecture, setActiveLecture] = useState(null);

  // ==========================================
  // GET SCHEDULES
  // ==========================================

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/schedules/today?date=${selectedDate}`,
          { credentials: "include" }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch schedules");
        const schedules = data.schedules || data.data || [];
        setLectures(schedules);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, [selectedDate]);

  // ==== Fetch all faculty once ==== 
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setFacultyLoading(true);
        const response = await fetch(`${API_URL}/api/faculty`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch faculty");
        // data.sections is an object keyed by department
        const flat = [];
        Object.values(data.sections || {}).forEach(sec => {
          sec.forEach(fac => flat.push({ name: fac.name, facultyId: fac.facultyId }));
        });
        setAllFaculty(flat);
      } catch (err) {
        console.error("Error fetching faculty:", err);
        setFacultyError(err.message);
      } finally {
        setFacultyLoading(false);
      }
    };
    fetchFaculty();
  }, []);



  // ==========================================
  // FILTER BY FACULTY NAME & AVAILABILITY
  // ==========================================

  const filteredLectures = lectures.filter((schedule) => {
    const search = searchFaculty.trim().toLowerCase();
    if (!search) return true;

    const facultyNames = [
      schedule.slot1?.facultyName,
      schedule.slot2?.facultyName,
      schedule.slot3?.facultyName,
    ];

    return facultyNames.some((name) =>
      name?.toLowerCase().includes(search)
    );
  });

  // ==== Utility: collect all active timetable slots for selected date ====
  const getAllTimetableSlots = (allSchedules) => {
    const slotsMap = new Map();
    allSchedules.forEach((schedule) => {
      [schedule.slot1, schedule.slot2, schedule.slot3].forEach((slot) => {
        if (slot && slot.startTime && slot.endTime) {
          const key = `${slot.startTime.trim()} - ${slot.endTime.trim()}`;
          if (!slotsMap.has(key)) {
            slotsMap.set(key, {
              startTime: slot.startTime.trim(),
              endTime: slot.endTime.trim(),
              time: key,
            });
          }
        }
      });
    });
    return Array.from(slotsMap.values());
  };

  // ==== Combine registered faculty and schedule faculty ====
  const combinedFacultyList = (() => {
    const map = new Map();
    allFaculty.forEach((fac) => {
      if (fac && fac.name) {
        map.set(fac.name.trim().toLowerCase(), {
          name: fac.name.trim(),
          facultyId: fac.facultyId || `fac-${fac.name}`,
          section: fac.section || "",
        });
      }
    });
    lectures.forEach((sch) => {
      [sch.slot1, sch.slot2, sch.slot3].forEach((slot) => {
        if (slot && slot.facultyName && slot.facultyName.trim()) {
          const norm = slot.facultyName.trim().toLowerCase();
          if (!map.has(norm)) {
            map.set(norm, {
              name: slot.facultyName.trim(),
              facultyId: slot.facultyId || `fac-${slot.facultyName}`,
              section: sch.department || "",
            });
          }
        }
      });
    });
    return Array.from(map.values());
  })();

  // ==== Utility: calculate schedule & free slots for a faculty member ====
  const getFacultyScheduleAndAvailability = (facName, allSchedules) => {
    const normName = facName.trim().toLowerCase();
    const scheduledLectures = [];
    const busySlotKeys = new Set();

    allSchedules.forEach((schedule) => {
      const slots = [
        { slotData: schedule.slot1, slotName: "Slot 1" },
        { slotData: schedule.slot2, slotName: "Slot 2" },
        { slotData: schedule.slot3, slotName: "Slot 3" },
      ];

      slots.forEach(({ slotData, slotName }) => {
        if (
          slotData &&
          slotData.facultyName &&
          slotData.facultyName.trim().toLowerCase().includes(normName)
        ) {
          const timeStr =
            slotData.startTime && slotData.endTime
              ? `${slotData.startTime.trim()} - ${slotData.endTime.trim()}`
              : "";
          if (timeStr) {
            busySlotKeys.add(timeStr);
          }
          scheduledLectures.push({
            subject: slotData.subject || "N/A",
            class: schedule.class || "N/A",
            department: schedule.department || "",
            startTime: slotData.startTime || "",
            endTime: slotData.endTime || "",
            time: timeStr || "N/A",
            room: slotData.room || "",
            slotName,
          });
        }
      });
    });

    const timetableSlots = getAllTimetableSlots(allSchedules);
    const freeSlots = timetableSlots.filter((ts) => !busySlotKeys.has(ts.time));

    return {
      scheduledLectures,
      freeSlots,
      hasTimetableData: timetableSlots.length > 0,
    };
  };

  // ==== Filtered Faculty List for Search / Filter View ====
  const filteredFacultyList = combinedFacultyList.filter((fac) => {
    const search = searchFaculty.trim().toLowerCase();
    const { scheduledLectures } = getFacultyScheduleAndAvailability(
      fac.name,
      lectures
    );
    const hasLecture = scheduledLectures.length > 0;

    if (search) {
      const nameMatch = fac.name.toLowerCase().includes(search);
      const subjectMatch = scheduledLectures.some((l) =>
        l.subject.toLowerCase().includes(search)
      );
      const classMatch = scheduledLectures.some((l) =>
        l.class.toLowerCase().includes(search)
      );
      if (!nameMatch && !subjectMatch && !classMatch) {
        return false;
      }
    }

    if (facultyFilter === "has" && !hasLecture) return false;
    if (facultyFilter === "none" && hasLecture) return false;

    return true;
  });

  // ==========================================
  // GROUP BY DEPARTMENT
  // ==========================================

  const departmentOrder = [
    "ITEG",
    "MEG",
    "BEG",
    "B.Tech",
  ];

  const groupedByDepartment =
    departmentOrder.reduce(
      (groups, department) => {
        groups[department] =
          filteredLectures.filter(
            (schedule) =>
              schedule.department === department
          );

        return groups;
      },
      {}
    );

  // ==========================================
  // OTHER DEPARTMENTS
  // ==========================================

  const otherDepartments = [
    ...new Set(
      filteredLectures
        .map(
          (schedule) => schedule.department
        )
        .filter(
          (department) =>
            department &&
            !departmentOrder.includes(
              department
            )
        )
    ),
  ];

  otherDepartments.forEach(
    (department) => {
      groupedByDepartment[department] =
        filteredLectures.filter(
          (schedule) =>
            schedule.department === department
        );
    }
  );

  // ==========================================
  // LECTURE STATUS
  // ==========================================

  const getLectureStatus = (
    date,
    startTime,
    endTime
  ) => {
    if (!startTime || !endTime) {
      return "Scheduled";
    }

    const now = new Date();

    const scheduleDate = new Date(date);

    if (
      Number.isNaN(
        scheduleDate.getTime()
      )
    ) {
      return "Scheduled";
    }

    const datePart =
      scheduleDate.toLocaleDateString(
        "en-CA"
      );

    const parseTime = (timeString) => {
      const match = timeString.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
      );

      if (!match) {
        return null;
      }

      let hours = Number(match[1]);

      const minutes = Number(match[2]);

      const period =
        match[3].toUpperCase();

      if (
        period === "PM" &&
        hours !== 12
      ) {
        hours += 12;
      }

      if (
        period === "AM" &&
        hours === 12
      ) {
        hours = 0;
      }

      const result = new Date(
        `${datePart}T00:00:00`
      );

      result.setHours(
        hours,
        minutes,
        0,
        0
      );

      return result;
    };

    const start =
      parseTime(startTime);

    const end =
      parseTime(endTime);

    if (!start || !end) {
      return "Scheduled";
    }

    if (now < start) {
      return "Scheduled";
    }

    if (
      now >= start &&
      now <= end
    ) {
      return "In Progress";
    }

    return "Completed";
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-CA"
    );
  };

  // ==========================================
  // ADD LECTURE
  // ==========================================

  const handleAddLecture = (e) => {
    e.preventDefault();

    if (
      !newLecture.subject ||
      !newLecture.faculty ||
      !newLecture.room
    ) {
      return;
    }

    /*
      Schedule creation is handled from
      Faculty Dashboard.

      Admin page currently displays
      database schedules.
    */

    setIsAddModalOpen(false);
  };

  // ==========================================
  // EDIT LECTURE
  // ==========================================

  const handleOpenEdit = (schedule) => {
    setActiveLecture(schedule);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();

    /*
      Schedule update API is not connected
      here yet.
    */

    setIsEditModalOpen(false);
    setActiveLecture(null);
  };

  // ==========================================
  // DELETE LECTURE
  // ==========================================

  const handleOpenDelete = (schedule) => {
    setActiveLecture(schedule);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    /*
      Schedule delete API can be connected
      here later.
    */

    setIsDeleteModalOpen(false);
    setActiveLecture(null);
  };

  // ==========================================
  // HELPER RENDERS
  // ==========================================

  const renderFacultyView = () => {
    if (facultyLoading) {
      return <div className="no-data-box">Loading faculty...</div>;
    }
    if (facultyError) {
      return <div className="no-data-box error">Error: {facultyError}</div>;
    }
    if (filteredFacultyList.length === 0) {
      return (
        <div className="no-data-box">
          No faculty members found matching "{searchFaculty}".
        </div>
      );
    }
    return (
      <div className="faculty-lecture-list">
        {filteredFacultyList.map((fac) => {
          const { scheduledLectures, freeSlots, hasTimetableData } =
            getFacultyScheduleAndAvailability(fac.name, lectures);
          const hasLectures = scheduledLectures.length > 0;
          const isFree = hasTimetableData && freeSlots.length > 0;

          return (
            <div key={fac.facultyId || fac.name} className="faculty-availability-card">
              <div className="faculty-card-header">
                <div className="faculty-info-title">
                  <h3>{fac.name}</h3>
                  {fac.section && (
                    <span className="faculty-dept-badge">{fac.section}</span>
                  )}
                </div>

                <div className="faculty-status-badges">
                  {hasLectures ? (
                    <span className="status-badge scheduled">
                      Lecture Scheduled
                    </span>
                  ) : (
                    <span className="status-badge no-lecture">
                      No Lecture Scheduled
                    </span>
                  )}

                  {isFree && (
                    <span className="status-badge free-badge">
                      FREE / Available
                    </span>
                  )}
                </div>
              </div>

              {/* Scheduled Lectures Section */}
              {hasLectures ? (
                <div className="faculty-card-body">
                  <h4 className="section-subtitle">Scheduled Lectures</h4>
                  <div className="scheduled-lectures-grid">
                    {scheduledLectures.map((lec, idx) => (
                      <div key={idx} className="lecture-detail-box">
                        <div className="lecture-detail-row">
                          <span className="detail-label">Class:</span>
                          <strong className="detail-value text-highlight">
                            {lec.class} {lec.department ? `(${lec.department})` : ""}
                          </strong>
                        </div>
                        <div className="lecture-detail-row">
                          <span className="detail-label">Subject:</span>
                          <strong className="detail-value">{lec.subject}</strong>
                        </div>
                        <div className="lecture-detail-row">
                          <span className="detail-label">Time:</span>
                          <span className="detail-value time-tag">{lec.time}</span>
                        </div>
                        {lec.room && (
                          <div className="lecture-detail-row">
                            <span className="detail-label">Room:</span>
                            <span className="detail-value">{lec.room}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-lecture-message">
                  <p>This faculty has no lecture scheduled for the selected date ({formatDate(selectedDate)}).</p>
                </div>
              )}

              {/* Free Time Slots Section */}
              {isFree && (
                <div className="faculty-free-section">
                  <span className="free-label">Available Time:</span>
                  <div className="free-slots-list">
                    {freeSlots.map((fs, idx) => (
                      <span key={idx} className="free-slot-pill">
                        {fs.time}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDepartmentView = () => {
    if (loading) {
      return <div className="no-data-box">Loading lectures...</div>;
    }
    if (filteredLectures.length === 0) {
      return (
        <div className="no-data-box">
          No lectures found for {formatDate(selectedDate)}.
        </div>
      );
    }

    const activeDepartments = Object.entries(groupedByDepartment).filter(
      ([, departmentSchedules]) => departmentSchedules.length > 0
    );

    if (activeDepartments.length === 0) {
      return (
        <div className="no-data-box">
          No lectures found for {formatDate(selectedDate)}.
        </div>
      );
    }

    return activeDepartments.map(([department, departmentSchedules]) => {
      const firstSchedule = departmentSchedules[0];
      const slot1Start = firstSchedule?.slot1?.startTime || "--:--";
      const slot1End = firstSchedule?.slot1?.endTime || "--:--";
      const lunchStart = firstSchedule?.lunchBreak?.startTime || "--:--";
      const lunchEnd = firstSchedule?.lunchBreak?.endTime || "--:--";
      const slot2Start = firstSchedule?.slot2?.startTime || "--:--";
      const slot2End = firstSchedule?.slot2?.endTime || "--:--";
      const teaStart = firstSchedule?.teaBreak?.startTime || "--:--";
      const teaEnd = firstSchedule?.teaBreak?.endTime || "--:--";
      const slot3Start = firstSchedule?.slot3?.startTime || "--:--";
      const slot3End = firstSchedule?.slot3?.endTime || "--:--";

      return (
        <div key={department} className="department-schedule-section">
          <div className="department-section-header">
            <div>
              <h2>{department}</h2>
              <span>
                {departmentSchedules.length} schedule
                {departmentSchedules.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="schedule-table-wrapper">
            <table className="academic-timetable admin-academic-timetable">
              <thead>
                <tr>
                  <th className="th-sno">S.No.</th>
                  <th className="th-class">Classes</th>
                  <th className="th-group">Groups Name</th>
                  <th className="th-strength">Strength</th>

                  <th className="th-slot">
                    <div className="slot-title">Slot 1</div>
                    <div className="slot-time">
                      {slot1Start} to {slot1End}
                    </div>
                  </th>

                  <th className="th-break">
                    <div className="slot-title">Lunch Break</div>
                    <div className="slot-time">
                      {lunchStart} to {lunchEnd}
                    </div>
                  </th>

                  <th className="th-slot">
                    <div className="slot-title">Slot 2</div>
                    <div className="slot-time">
                      {slot2Start} to {slot2End}
                    </div>
                  </th>

                  <th className="th-break">
                    <div className="slot-title">Tea Break</div>
                    <div className="slot-time">
                      {teaStart} to {teaEnd}
                    </div>
                  </th>

                  <th className="th-slot">
                    <div className="slot-title">Slot 3</div>
                    <div className="slot-time">
                      {slot3Start} to {slot3End}
                    </div>
                  </th>

                  <th className="th-action">Action</th>
                </tr>
              </thead>

              <tbody>
                {departmentSchedules.map((row, index) => (
                  <tr key={row._id || `${department}-${index}`}>
                    <td className="td-sno">{index + 1}</td>
                    <td className="td-class">{row.class || "-"}</td>
                    <td className="td-group">
                      {Array.isArray(row.groups)
                        ? row.groups.join(", ")
                        : row.groups || "-"}
                    </td>
                    <td className="td-strength">{row.strength ?? 0}</td>

                    <LectureCell data={row.slot1} />

                    {index === 0 && (
                      <td
                        rowSpan={departmentSchedules.length}
                        className="break-cell lunch-break"
                      >
                        <div className="break-text">LUNCH BREAK</div>
                      </td>
                    )}

                    <LectureCell data={row.slot2} />

                    {index === 0 && (
                      <td
                        rowSpan={departmentSchedules.length}
                        className="break-cell tea-break"
                      >
                        <div className="break-text">TEA BREAK</div>
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
                          onClick={() => handleOpenEdit(row)}
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
                          onClick={() => handleOpenDelete(row)}
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
      );
    });
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="manage-lectures-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="lectures-header">

        <div>
          <h1>
            Manage Lectures
          </h1>

          <p>
            View and manage all departments'
            academic lecture schedules.
          </p>
        </div>

        {/* =====================================
            FILTERS
        ===================================== */}

        <div className="lecture-filters">

          {/* SEARCH FACULTY */}
          <div className="lecture-search-filter">
            <label htmlFor="faculty-search">Search Faculty</label>
            <div className="search-input-wrapper">
              <FiSearch />
              <input
                id="faculty-search"
                type="text"
                placeholder="Search faculty name..."
                value={searchFaculty}
                onChange={(e) => setSearchFaculty(e.target.value)}
              />
            </div>
          </div>

          {/* SELECT DATE */}
          <div className="lecture-date-filter">
            <label htmlFor="lecture-date">Select Date</label>
            <input
              id="lecture-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* FACULTY FILTER OPTIONS */}
          <div className="lecture-faculty-filter">
            <label>Filter Faculty</label>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
            >
              <option value="all">All Faculty</option>
              <option value="has">Has Lecture</option>
              <option value="none">No Lecture</option>
            </select>
          </div>

        </div>

      </div>


      {/* =====================================
          FILTER INFO
      ===================================== */}

      <div className="lecture-filter-info">

        <span>
          Date:{" "}
          <strong>
            {formatDate(selectedDate)}
          </strong>
        </span>

        {searchFaculty.trim() && (
          <span>
            Faculty Search:{" "}
            <strong>
              {searchFaculty}
            </strong>
          </span>
        )}

        <span>
          Schedules Found:{" "}
          <strong>
            {filteredLectures.length}
          </strong>
        </span>

      </div>


      {/* =====================================
          DEPARTMENT WISE TABLES
      ===================================== */}

      <div className="department-schedules-container">
        {searchFaculty.trim() || facultyFilter !== 'all'
          ? renderFacultyView()
          : renderDepartmentView()}
      </div>


      {/* =====================================
          ADD LECTURE MODAL
      ===================================== */}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() =>
          setIsAddModalOpen(false)
        }
        title="Schedule New Lecture"
      >

        <form
          onSubmit={handleAddLecture}
          className="lecture-modal-form"
        >

          {/* SUBJECT */}

          <div className="modal-form-group">

            <label>
              Subject / Topic
            </label>

            <input
              type="text"
              placeholder="e.g. Java OOP Concepts"
              value={
                newLecture.subject
              }
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  subject:
                    e.target.value,
                })
              }
              required
            />

          </div>


          {/* FACULTY */}

          <div className="modal-form-group">

            <label>
              Faculty Name
            </label>

            <input
              type="text"
              placeholder="e.g. Dr. Rahul Sharma"
              value={
                newLecture.faculty
              }
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  faculty:
                    e.target.value,
                })
              }
              required
            />

          </div>


          {/* DEPARTMENT */}

          <div className="modal-form-group">

            <label>
              Department
            </label>

            <select
              value={
                newLecture.department
              }
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  department:
                    e.target.value,
                })
              }
            >

              {departments.map(
                (department) => (

                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>

                )
              )}

            </select>

          </div>


          {/* DATE */}

          <div className="modal-form-group">

            <label>
              Date
            </label>

            <input
              type="date"
              value={
                newLecture.date
              }
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  date: e.target.value,
                })
              }
              required
            />

          </div>


          {/* TIME */}

          <div className="modal-form-group">

            <label>
              Time Slot
            </label>

            <input
              type="text"
              placeholder="e.g. 10:00 AM - 11:30 AM"
              value={
                newLecture.time
              }
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  time: e.target.value,
                })
              }
              required
            />

          </div>


          {/* ROOM */}

          <div className="modal-form-group">

            <label>
              Room / Venue
            </label>

            <input
              type="text"
              placeholder="e.g. Lab-3"
              value={
                newLecture.room
              }
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  room: e.target.value,
                })
              }
              required
            />

          </div>


          {/* STATUS */}

          <div className="modal-form-group">

            <label>
              Status
            </label>

            <select
              value={
                newLecture.status
              }
              onChange={(e) =>
                setNewLecture({
                  ...newLecture,
                  status:
                    e.target.value,
                })
              }
            >

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>

            </select>

          </div>


          {/* BUTTONS */}

          <div className="modal-actions">

            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setIsAddModalOpen(false)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              Schedule Lecture
            </button>

          </div>

        </form>

      </Modal>


      {/* =====================================
          EDIT SCHEDULE MODAL
      ===================================== */}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveLecture(null);
        }}
        title="Edit Scheduled Lecture"
      >

        {activeLecture && (

          <form
            onSubmit={
              handleSaveEdit
            }
            className="lecture-modal-form"
          >

            {/* CLASS */}

            <div className="modal-form-group">

              <label>
                Classroom / Venue
              </label>

              <input
                type="text"
                value={
                  activeLecture.class ||
                  ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    class:
                      e.target.value,
                  })
                }
              />

            </div>


            {/* GROUPS */}

            <div className="modal-form-group">

              <label>
                Groups
              </label>

              <input
                type="text"
                value={
                  Array.isArray(
                    activeLecture.groups
                  )
                    ? activeLecture.groups.join(
                        ", "
                      )
                    : activeLecture.groups ||
                      ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    groups:
                      e.target.value
                        .split(",")
                        .map(
                          (group) =>
                            group.trim()
                        )
                        .filter(Boolean),
                  })
                }
              />

            </div>


            {/* DEPARTMENT */}

            <div className="modal-form-group">

              <label>
                Department
              </label>

              <select
                value={
                  activeLecture.department ||
                  ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    department:
                      e.target.value,
                  })
                }
              >

                {departments.map(
                  (department) => (

                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* SLOT 1 */}

            <div className="modal-form-section">

              <strong>
                Slot 1
              </strong>

              <input
                type="text"
                placeholder="Subject"
                value={
                  activeLecture.slot1
                    ?.subject || ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    slot1: {
                      ...activeLecture.slot1,
                      subject:
                        e.target.value,
                    },
                  })
                }
              />

              <input
                type="text"
                placeholder="Faculty Name"
                value={
                  activeLecture.slot1
                    ?.facultyName || ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    slot1: {
                      ...activeLecture.slot1,
                      facultyName:
                        e.target.value,
                    },
                  })
                }
              />

            </div>


            {/* SLOT 2 */}

            <div className="modal-form-section">

              <strong>
                Slot 2
              </strong>

              <input
                type="text"
                placeholder="Subject"
                value={
                  activeLecture.slot2
                    ?.subject || ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    slot2: {
                      ...activeLecture.slot2,
                      subject:
                        e.target.value,
                    },
                  })
                }
              />

              <input
                type="text"
                placeholder="Faculty Name"
                value={
                  activeLecture.slot2
                    ?.facultyName || ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    slot2: {
                      ...activeLecture.slot2,
                      facultyName:
                        e.target.value,
                    },
                  })
                }
              />

            </div>


            {/* SLOT 3 */}

            <div className="modal-form-section">

              <strong>
                Slot 3
              </strong>

              <input
                type="text"
                placeholder="Subject"
                value={
                  activeLecture.slot3
                    ?.subject || ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    slot3: {
                      ...activeLecture.slot3,
                      subject:
                        e.target.value,
                    },
                  })
                }
              />

              <input
                type="text"
                placeholder="Faculty Name"
                value={
                  activeLecture.slot3
                    ?.facultyName || ""
                }
                onChange={(e) =>
                  setActiveLecture({
                    ...activeLecture,
                    slot3: {
                      ...activeLecture.slot3,
                      facultyName:
                        e.target.value,
                    },
                  })
                }
              />

            </div>


            {/* BUTTONS */}

            <div className="modal-actions">

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setActiveLecture(null);
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
              >
                Save Changes
              </button>

            </div>

          </form>

        )}

      </Modal>


      {/* =====================================
          DELETE CONFIRMATION MODAL
      ===================================== */}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() =>
          setIsDeleteModalOpen(false)
        }
        title="Delete Lecture"
      >

        <div className="confirm-delete-body">

          <span className="confirm-icon">
            <FiTrash2 />
          </span>

          <p>

            Are you sure you want to
            delete the schedule{" "}

            <strong>
              {activeLecture?.class ||
                "this schedule"}
            </strong>

            ?

            <br />

            This action cannot be undone.

          </p>

        </div>


        <div className="modal-actions">

          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setIsDeleteModalOpen(false)
            }
          >
            Keep Schedule
          </button>


          <button
            type="button"
            className="btn-danger"
            onClick={
              handleConfirmDelete
            }
          >
            Yes, Delete
          </button>

        </div>

      </Modal>

    </div>
  );
}

export default ManageLectures;