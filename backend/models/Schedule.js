const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    groups: {
      type: [String],
      required: true,
    },

    class: {
      type: String,
      required: true,
      trim: true,
    },

    strength: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // SLOT 1
    // ==========================================
    slot1: {
      subject: {
        type: String,
        trim: true,
      },

      facultyId: {
        type: String,
        trim: true,
      },

      facultyName: {
        type: String,
        trim: true,
      },

      startTime: {
        type: String,
      },

      endTime: {
        type: String,
      },

      feedbackEmailSent: {
        type: Boolean,
        default: false,
      },
    },

    // ==========================================
    // LUNCH BREAK
    // ==========================================
    lunchBreak: {
      startTime: {
        type: String,
      },

      endTime: {
        type: String,
      },
    },

    // ==========================================
    // SLOT 2
    // ==========================================
    slot2: {
      subject: {
        type: String,
        trim: true,
      },

      facultyId: {
        type: String,
        trim: true,
      },

      facultyName: {
        type: String,
        trim: true,
      },

      startTime: {
        type: String,
      },

      endTime: {
        type: String,
      },

      feedbackEmailSent: {
        type: Boolean,
        default: false,
      },
    },

    // ==========================================
    // TEA BREAK
    // ==========================================
    teaBreak: {
      startTime: {
        type: String,
      },

      endTime: {
        type: String,
      },
    },

    // ==========================================
    // SLOT 3
    // ==========================================
    slot3: {
      subject: {
        type: String,
        trim: true,
      },

      facultyId: {
        type: String,
        trim: true,
      },

      facultyName: {
        type: String,
        trim: true,
      },

      startTime: {
        type: String,
      },

      endTime: {
        type: String,
      },

      feedbackEmailSent: {
        type: Boolean,
        default: false,
      },
    },
  },

  {
    timestamps: true,
    collection: "Schedules",
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);