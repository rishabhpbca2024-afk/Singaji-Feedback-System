const cron = require("node-cron");
const Schedule = require("../models/Schedule");
const { sendFeedbackLinkEmail } = require("./sendEmail");
const SelectedStudents = require("../models/SeletedStudents");
const { maskEmail } = require("./hashUtils");

// ==========================================
// TIME -> MINUTES
// ==========================================

const timeToMinutes = (time) => {
    if (!time) return null;

    const value = time.trim().toUpperCase();

    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);

    if (!match) return null;

    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3];

    if (period === "AM" && hour === 12) {
        hour = 0;
    }

    if (period === "PM" && hour !== 12) {
        hour += 12;
    }

    return hour * 60 + minute;
};

// ==========================================
// CURRENT IST TIME
// ==========================================

const getCurrentISTMinutes = () => {
    const parts = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date());

    const hour = parseInt(
        parts.find((part) => part.type === "hour").value
    );

    const minute = parseInt(
        parts.find((part) => part.type === "minute").value
    );

    return hour * 60 + minute;
};

// ==========================================
// PROCESS ONE LECTURE SLOT
// ==========================================

const processSlot = async (schedule, slotName) => {
    try {
        const slot = schedule[slotName];

        if (!slot) return;

        // Required lecture information
        if (!slot.subject || !slot.facultyName || !slot.endTime) {
            return;
        }

        const currentMinutes = getCurrentISTMinutes();
        const endMinutes = timeToMinutes(slot.endTime);

        if (endMinutes === null) {
            console.log(
                `[SCHEDULER] Invalid end time: ${slot.endTime}`
            );
            return;
        }

        // ==========================================
        // LECTURE END TIME REACHED
        // ==========================================

        const timeDifference = currentMinutes - endMinutes;

        if (timeDifference < 0 || timeDifference > 2) {
            return;
        }

        // Already sent check
        if (slot.feedbackEmailSent === true) {
            return;
        }

        // Atomic lock claim: Claim this slot in MongoDB before sending.
        // Prevents duplicate emails when multiple server instances (e.g. Render cloud + Localhost dev) run concurrently.
        const claimPath = `${slotName}.feedbackEmailSent`;
        const claimed = await Schedule.findOneAndUpdate(
            {
                _id: schedule._id,
                [claimPath]: { $ne: true },
            },
            {
                $set: {
                    [claimPath]: true,
                },
            },
            { new: true }
        );

        if (!claimed) {
            return; // Already sent or claimed by another server instance
        }

        console.log("==========================================");
        console.log(
            `[SCHEDULER] ${slotName} lecture ended (claimed by this instance)`
        );
        console.log(`Faculty: ${slot.facultyName}`);
        console.log(`Subject: ${slot.subject}`);
        console.log(`End Time: ${slot.endTime}`);
        console.log("==========================================");

        // ==========================================
        // FIND STUDENTS
        // ==========================================

        const students = await SelectedStudents.find({
            department: schedule.department,
            level: { $in: schedule.groups },
        });

        if (students.length === 0) {
            console.log(
                `[SCHEDULER] No students found for ${schedule.department}`
            );
            return;
        }

        console.log(
            `[SCHEDULER] Students found: ${students.length}`
        );

        // ==========================================
        // SEND EMAIL TO EVERY STUDENT
        // ==========================================

        const time = `${slot.startTime} - ${slot.endTime}`;

        let successCount = 0;

        for (const student of students) {
            console.log(
                `[SCHEDULER] Sending feedback email to ${maskEmail(student.gmail)}`
            );

           const result = await sendFeedbackLinkEmail(
             student.gmail,
             schedule.department,
             student.level,
             student.section,
             slot.facultyId,
             slot.facultyName,
             slot.subject,
             time,
             slot.endTime
);

            if (result.success) {
                successCount++;
            }
        }

        // ==========================================
        // SUMMARY & ROLLBACK IF TOTAL FAILURE
        // ==========================================

        if (successCount === 0 && students.length > 0) {
            // All emails failed, rollback claim so it can retry
            await Schedule.findByIdAndUpdate(schedule._id, {
                $set: { [claimPath]: false },
            });
            console.log("==========================================");
            console.log(`[SCHEDULER] All emails failed for ${slotName}, rolled back claim for retry.`);
            console.log("==========================================");
        } else {
            console.log("==========================================");
            console.log(
                `[SCHEDULER] Feedback emails sent: ${successCount}/${students.length}`
            );
            console.log(
                `[SCHEDULER] ${slotName} marked as completed`
            );
            console.log("==========================================");
        }
    } catch (error) {
        console.error(
            `[SCHEDULER SLOT ERROR] ${slotName}:`,
            error.message
        );
    }
};

// ==========================================
// CHECK TODAY'S SCHEDULES
// ==========================================

const checkSchedules = async () => {
    try {
        const now = new Date();

        // Get current date in IST
        const parts = new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(now);

        const year = parseInt(
            parts.find((part) => part.type === "year").value
        );

        const month = parseInt(
            parts.find((part) => part.type === "month").value
        );

        const day = parseInt(
            parts.find((part) => part.type === "day").value
        );

        // IST offset
        const istOffset = 5.5 * 60 * 60 * 1000;

        // Start of today in IST
        const startOfDay = new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                0,
                0,
                0
            ) - istOffset
        );

        // End of today in IST
        const endOfDay = new Date(
            Date.UTC(
                year,
                month - 1,
                day + 1,
                0,
                0,
                0
            ) - istOffset
        );

        // ==========================================
        // GET TODAY'S SCHEDULES ONLY
        // ==========================================

        const schedules = await Schedule.find({
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
        });

        console.log(
            `[SCHEDULER] Today's schedules found: ${schedules.length}`
        );

        // ==========================================
        // CHECK ALL 3 LECTURE SLOTS
        // ==========================================

        for (const schedule of schedules) {
            await processSlot(schedule, "slot1");
            await processSlot(schedule, "slot2");
            await processSlot(schedule, "slot3");
        }
    } catch (error) {
        console.error(
            "[SCHEDULER ERROR]:",
            error.message
        );
    }
};

// ==========================================
// START SCHEDULER
// ==========================================

const startEmailScheduler = () => {
    console.log("==========================================");
    console.log("Feedback Email Scheduler Started");
    console.log("Checking lecture end times every minute...");
    console.log("==========================================");

    cron.schedule(
        "* * * * *",
        async () => {
            console.log(
                `[SCHEDULER CHECK] ${new Date().toISOString()}`
            );
            
            await checkSchedules();
        },
        {
            timezone: "Asia/Kolkata",
        }
    );
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    startEmailScheduler,
};
