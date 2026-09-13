import { useEffect, useState } from "react";
import { FiShare2 } from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";
import "./FacultySchedule.css";

const API_URL = import.meta.env.VITE_API_URL;

function FacultySchedule() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [scheduleTiming, setScheduleTiming] = useState({
    slot1: { startTime: "", endTime: "" },
    lunchBreak: { startTime: "", endTime: "" },
    slot2: { startTime: "", endTime: "" },
    teaBreak: { startTime: "", endTime: "" },
    slot3: { startTime: "", endTime: "" },
  });

  const authUser = JSON.parse(localStorage.getItem("authUser"));

  // Get only today's schedules for the logged-in faculty's department
  useEffect(() => {
    const fetchTodaySchedules = async () => {
      try {
        if (!user?.department) return;

        const response = await fetch(
          `${API_URL}/api/schedules/today?department=${encodeURIComponent(
            user.department
          )}`,
           {
              credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Failed to fetch today's schedules:",
            data.message
          );
          return;
        }

        const dbSchedules = data.schedules || [];

        // Filter schedules so the faculty only sees rows where their email/name matches one of the assigned slots
        const userEmail = user?.email?.toLowerCase().trim() || "";
        const userName = user?.name?.toLowerCase().trim() || "";

        const mySchedules = dbSchedules.filter((row) => {
          const slot1Match =
            (row.slot1?.facultyId && row.slot1.facultyId.toLowerCase() === userEmail) ||
            (row.slot1?.facultyName && row.slot1.facultyName.toLowerCase().includes(userName));

          const slot2Match =
            (row.slot2?.facultyId && row.slot2.facultyId.toLowerCase() === userEmail) ||
            (row.slot2?.facultyName && row.slot2.facultyName.toLowerCase().includes(userName));

          const slot3Match =
            (row.slot3?.facultyId && row.slot3.facultyId.toLowerCase() === userEmail) ||
            (row.slot3?.facultyName && row.slot3.facultyName.toLowerCase().includes(userName));

          return slot1Match || slot2Match || slot3Match;
        });

        setSchedules(mySchedules);

        // Timings set from the department's first schedule if available
        if (dbSchedules.length > 0) {
          const firstSchedule = dbSchedules[0];

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

    fetchTodaySchedules();
  }, [user?.department, user?.email, user?.name]);

  const today = new Date();

  const currentDate = today
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");

  const currentDay = today.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const formatTime = (time) => {
    if (!time) return "--:--";

    const [hours, minutes] = time.split(":");
    const hour = Number(hours);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${minutes} ${suffix}`;
  };

  const handleShareSchedule = async () => {
    let shareText =
      "SANT SINGAJI INSTITUTE OF SCIENCE AND MANAGEMENT, SANDALPUR\n";
    shareText += `My Personal Schedule | Date: ${currentDate} | Day: ${currentDay}\n`;
    shareText += "====================================\n\n";

    schedules.forEach((row) => {
      shareText += `Class: ${row.class} | Group: ${
        row.groups?.join(", ") || ""
      } | Strength: ${row.strength}\n`;

      shareText += `[${formatTime(
        scheduleTiming.slot1.startTime
      )} - ${formatTime(
        scheduleTiming.slot1.endTime
      )}]: ${row.slot1?.subject || "Empty"} (${
        row.slot1?.facultyName || "None"
      })\n`;

      shareText += `[${formatTime(
        scheduleTiming.lunchBreak.startTime
      )} - ${formatTime(
        scheduleTiming.lunchBreak.endTime
      )}]: LUNCH BREAK\n`;

      shareText += `[${formatTime(
        scheduleTiming.slot2.startTime
      )} - ${formatTime(
        scheduleTiming.slot2.endTime
      )}]: ${row.slot2?.subject || "Empty"} (${
        row.slot2?.facultyName || "None"
      })\n`;

      shareText += `[${formatTime(
        scheduleTiming.teaBreak.startTime
      )} - ${formatTime(
        scheduleTiming.teaBreak.endTime
      )}]: TEA BREAK\n`;

      shareText += `[${formatTime(
        scheduleTiming.slot3.startTime
      )} - ${formatTime(
        scheduleTiming.slot3.endTime
      )}]: ${row.slot3?.subject || "Empty"} (${
        row.slot3?.facultyName || "None"
      })\n`;

      shareText += "------------------------------------\n";
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Academic Schedule",
          text: shareText,
        });
      } catch (error) {
        console.error("Error sharing schedule", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Personal schedule copied to clipboard!");
      } catch (error) {
        alert("Failed to copy schedule to clipboard.");
      }
    }
  };

  const userEmail = user?.email?.toLowerCase().trim() || "";
  const userName = user?.name?.toLowerCase().trim() || "";

  const isMySlot = (slot) => {
    if (!slot) return false;
    const matchEmail = slot.facultyId && slot.facultyId.toLowerCase() === userEmail;
    const matchName = slot.facultyName && slot.facultyName.toLowerCase().includes(userName);
    return matchEmail || matchName;
  };

  return (
    <div className="faculty-page">
      <div className="faculty-page-header">
        <h1>My Personal Schedule</h1>
        <p>Lectures assigned to {user?.name || user?.email} for today.</p>
      </div>

      <div className="timetable-wrapper">
        <div className="timetable-header-top">
          <div className="institute-info">
            <h2>
              Sant Singaji Institute of Science and Management, Sandalpur
            </h2>
            <p>
              Faculty: <strong>{user?.name || user?.email}</strong> • Date: {currentDate} ({currentDay})
            </p>
          </div>

          <button
            className="btn-share-schedule"
            onClick={handleShareSchedule}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <FiShare2 /> Share My Schedule
          </button>
        </div>

        <div className="table-responsive">
          <table className="academic-timetable">
            <thead>
              <tr>
                <th rowSpan="2">S.No.</th>
                <th rowSpan="2">Classes</th>
                <th rowSpan="2">Groups Name</th>
                <th rowSpan="2">Strength</th>
                <th>Slot 1</th>
                <th rowSpan="2">Lunch Break</th>
                <th>Slot 2</th>
                <th rowSpan="2">Tea Break</th>
                <th>Slot 3</th>
              </tr>

              <tr className="timing-header">
                <th>
                  {formatTime(scheduleTiming.slot1.startTime)} to{" "}
                  {formatTime(scheduleTiming.slot1.endTime)}
                </th>

                <th>
                  {formatTime(scheduleTiming.slot2.startTime)} to{" "}
                  {formatTime(scheduleTiming.slot2.endTime)}
                </th>

                <th>
                  {formatTime(scheduleTiming.slot3.startTime)} to{" "}
                  {formatTime(scheduleTiming.slot3.endTime)}
                </th>
              </tr>
            </thead>

            <tbody>
              {schedules.map((row, index) => (
                <tr key={row._id}>
                  <td>{index + 1}</td>
                  <td>{row.class}</td>
                  <td>{row.groups?.join(", ") || "-"}</td>
                  <td>{row.strength}</td>

                  {/* Slot 1 */}
                  <td className={isMySlot(row.slot1) ? "my-assigned-slot" : ""}>
                    {row.slot1?.subject ? (
                      <>
                        <div className="slot-subject">
                          {row.slot1.subject}
                        </div>
                        <div className="slot-faculty">
                          {row.slot1.facultyName}
                        </div>
                      </>
                    ) : (
                      <div className="empty-slot">-</div>
                    )}
                  </td>

                  {index === 0 && (
                    <td
                      className="break-cell"
                      rowSpan={schedules.length}
                    >
                      LUNCH BREAK
                    </td>
                  )}

                  {/* Slot 2 */}
                  <td className={isMySlot(row.slot2) ? "my-assigned-slot" : ""}>
                    {row.slot2?.subject ? (
                      <>
                        <div className="slot-subject">
                          {row.slot2.subject}
                        </div>
                        <div className="slot-faculty">
                          {row.slot2.facultyName}
                        </div>
                      </>
                    ) : (
                      <div className="empty-slot">-</div>
                    )}
                  </td>

                  {index === 0 && (
                    <td
                      className="break-cell"
                      rowSpan={schedules.length}
                    >
                      TEA BREAK
                    </td>
                  )}

                  {/* Slot 3 */}
                  <td className={isMySlot(row.slot3) ? "my-assigned-slot" : ""}>
                    {row.slot3?.subject ? (
                      <>
                        <div className="slot-subject">
                          {row.slot3.subject}
                        </div>
                        <div className="slot-faculty">
                          {row.slot3.facultyName}
                        </div>
                      </>
                    ) : (
                      <div className="empty-slot">-</div>
                    )}
                  </td>
                </tr>
              ))}

              {schedules.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-schedule">
                    No lectures assigned to you today ({user?.name || user?.email}).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FacultySchedule;
