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

        /*
          IMPORTANT:

          Admin should see ALL departments.

          Therefore we intentionally do NOT send:

          ?department=...

          Faculty Dashboard sends department parameter,
          but Admin does not.
        */

        const response = await fetch(
          `${API_URL}/api/schedules/today?date=${selectedDate}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch schedules"
          );
        }

        const schedules =
          data.schedules || data.data || [];

        // Keep original schedule structure
        setLectures(schedules);
      } catch (error) {
        console.error(
          "Error fetching schedules:",
          error
        );

        setLectures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, [selectedDate]);

  // ==========================================
  // FILTER BY FACULTY NAME
  // ==========================================

  const filteredLectures = lectures.filter(
    (schedule) => {
      const search = searchFaculty
        .trim()
        .toLowerCase();

      // No search
      if (!search) {
        return true;
      }

      const facultyNames = [
        schedule.slot1?.facultyName,
        schedule.slot2?.facultyName,
        schedule.slot3?.facultyName,
      ];

      return facultyNames.some((name) =>
        name?.toLowerCase().includes(search)
      );
    }
  );

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

            <label htmlFor="faculty-search">
              Search Faculty
            </label>

            <div className="search-input-wrapper">

              <FiSearch />

              <input
                id="faculty-search"
                type="text"
                placeholder="Search faculty name..."
                value={searchFaculty}
                onChange={(e) =>
                  setSearchFaculty(
                    e.target.value
                  )
                }
              />

            </div>

          </div>


          {/* SELECT DATE */}

          <div className="lecture-date-filter">

            <label htmlFor="lecture-date">
              Select Date
            </label>

            <input
              id="lecture-date"
              type="date"
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(
                  e.target.value
                )
              }
            />

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

        {loading ? (

          <div className="no-data-box">
            Loading lectures...
          </div>

        ) : filteredLectures.length === 0 ? (

          <div className="no-data-box">
            No lectures found for{" "}
            {formatDate(selectedDate)}.
          </div>

        ) : (

          Object.entries(
            groupedByDepartment
          )

            /*
              Empty departments should
              not be shown.
            */

            .filter(
              ([, departmentSchedules]) =>
                departmentSchedules.length > 0
            )

            .map(
              ([
                department,
                departmentSchedules,
              ]) => {

                /*
                  Each department can have
                  different timing in future,
                  so timing is taken from
                  that department's first
                  schedule.
                */

                const firstSchedule =
                  departmentSchedules[0];

                const slot1Start =
                  firstSchedule?.slot1
                    ?.startTime ||
                  "--:--";

                const slot1End =
                  firstSchedule?.slot1
                    ?.endTime ||
                  "--:--";

                const lunchStart =
                  firstSchedule
                    ?.lunchBreak
                    ?.startTime ||
                  "--:--";

                const lunchEnd =
                  firstSchedule
                    ?.lunchBreak
                    ?.endTime ||
                  "--:--";

                const slot2Start =
                  firstSchedule?.slot2
                    ?.startTime ||
                  "--:--";

                const slot2End =
                  firstSchedule?.slot2
                    ?.endTime ||
                  "--:--";

                const teaStart =
                  firstSchedule
                    ?.teaBreak
                    ?.startTime ||
                  "--:--";

                const teaEnd =
                  firstSchedule
                    ?.teaBreak
                    ?.endTime ||
                  "--:--";

                const slot3Start =
                  firstSchedule?.slot3
                    ?.startTime ||
                  "--:--";

                const slot3End =
                  firstSchedule?.slot3
                    ?.endTime ||
                  "--:--";

                return (
                  <div
                    key={department}
                    className="department-schedule-section"
                  >

                    {/* =================================
                        DEPARTMENT HEADER
                    ================================= */}

                    <div className="department-section-header">

                      <div>

                        <h2>
                          {department}
                        </h2>

                        <span>
                          {
                            departmentSchedules.length
                          }{" "}
                          schedule
                          {departmentSchedules.length !==
                          1
                            ? "s"
                            : ""}
                        </span>

                      </div>

                    </div>


                    {/* =================================
                        TABLE
                    ================================= */}

                    <div className="schedule-table-wrapper">

                      <table className="academic-timetable admin-academic-timetable">

                        {/* ===========================
                            TABLE HEADER
                        =========================== */}

                        <thead>

                          <tr>

                            <th className="th-sno">
                              S.No.
                            </th>

                            <th className="th-class">
                              Classes
                            </th>

                            <th className="th-group">
                              Groups Name
                            </th>

                            <th className="th-strength">
                              Strength
                            </th>


                            {/* SLOT 1 */}

                            <th className="th-slot">

                              <div className="slot-title">
                                Slot 1
                              </div>

                              <div className="slot-time">

                                {slot1Start}

                                {" to "}

                                {slot1End}

                              </div>

                            </th>


                            {/* LUNCH */}

                            <th className="th-break">

                              <div className="slot-title">
                                Lunch Break
                              </div>

                              <div className="slot-time">

                                {lunchStart}

                                {" to "}

                                {lunchEnd}

                              </div>

                            </th>


                            {/* SLOT 2 */}

                            <th className="th-slot">

                              <div className="slot-title">
                                Slot 2
                              </div>

                              <div className="slot-time">

                                {slot2Start}

                                {" to "}

                                {slot2End}

                              </div>

                            </th>


                            {/* TEA */}

                            <th className="th-break">

                              <div className="slot-title">
                                Tea Break
                              </div>

                              <div className="slot-time">

                                {teaStart}

                                {" to "}

                                {teaEnd}

                              </div>

                            </th>


                            {/* SLOT 3 */}

                            <th className="th-slot">

                              <div className="slot-title">
                                Slot 3
                              </div>

                              <div className="slot-time">

                                {slot3Start}

                                {" to "}

                                {slot3End}

                              </div>

                            </th>


                            {/* ACTION */}

                            <th className="th-action">
                              Action
                            </th>

                          </tr>

                        </thead>


                        {/* ===========================
                            TABLE BODY
                        =========================== */}

                        <tbody>

                          {departmentSchedules.map(
                            (row, index) => (

                              <tr
                                key={
                                  row._id ||
                                  `${department}-${index}`
                                }
                              >

                                {/* S.NO */}

                                <td className="td-sno">
                                  {index + 1}
                                </td>


                                {/* CLASS */}

                                <td className="td-class">
                                  {row.class ||
                                    "-"}
                                </td>


                                {/* GROUP */}

                                <td className="td-group">

                                  {Array.isArray(
                                    row.groups
                                  )
                                    ? row.groups.join(
                                        ", "
                                      )
                                    : row.groups ||
                                      "-"}

                                </td>


                                {/* STRENGTH */}

                                <td className="td-strength">
                                  {row.strength ??
                                    0}
                                </td>


                                {/* SLOT 1 */}

                                <LectureCell
                                  data={
                                    row.slot1
                                  }
                                />


                                {/* LUNCH BREAK */}

                                {index === 0 && (

                                  <td
                                    rowSpan={
                                      departmentSchedules.length
                                    }
                                    className="break-cell lunch-break"
                                  >

                                    <div className="break-text">
                                      LUNCH BREAK
                                    </div>

                                  </td>

                                )}


                                {/* SLOT 2 */}

                                <LectureCell
                                  data={
                                    row.slot2
                                  }
                                />


                                {/* TEA BREAK */}

                                {index === 0 && (

                                  <td
                                    rowSpan={
                                      departmentSchedules.length
                                    }
                                    className="break-cell tea-break"
                                  >

                                    <div className="break-text">
                                      TEA BREAK
                                    </div>

                                  </td>

                                )}


                                {/* SLOT 3 */}

                                <LectureCell
                                  data={
                                    row.slot3
                                  }
                                />


                                {/* ACTION */}

                                <td className="td-action">

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      gap: "10px",
                                    }}
                                  >

                                    {/* EDIT */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenEdit(
                                          row
                                        )
                                      }
                                      title="Edit Schedule"
                                      style={{
                                        border:
                                          "none",
                                        background:
                                          "transparent",
                                        cursor:
                                          "pointer",
                                        fontSize:
                                          "16px",
                                        padding:
                                          "4px",
                                        display:
                                          "inline-flex",
                                        alignItems:
                                          "center",
                                      }}
                                    >

                                      <FiEdit2 color="#2563eb" />

                                    </button>


                                    {/* DELETE */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenDelete(
                                          row
                                        )
                                      }
                                      title="Delete Schedule"
                                      style={{
                                        border:
                                          "none",
                                        background:
                                          "transparent",
                                        cursor:
                                          "pointer",
                                        fontSize:
                                          "16px",
                                        padding:
                                          "4px",
                                        display:
                                          "inline-flex",
                                        alignItems:
                                          "center",
                                      }}
                                    >

                                      <FiTrash2 color="#ef4444" />

                                    </button>

                                  </div>

                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>
                );
              }
            )
        )}

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