const mongoose = require("mongoose");

const feedbackSubmissionSchema = new mongoose.Schema(
  {
    studentHash: {
      type: String,
      required: true,
      index: true,
    },

    facultyId: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    lectureEndTime: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    level: {
      type: String,
      trim: true,
      default: "",
    },

    section: {
      type: String,
      trim: true,
      default: "",
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: "FeedbackSubmissions",
    timestamps: true,
  }
);

// Compound unique index to strictly prevent duplicate feedback submissions
// per student hash for the same faculty, subject, and lecture time slot
feedbackSubmissionSchema.index(
  {
    studentHash: 1,
    facultyId: 1,
    subject: 1,
    lectureEndTime: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("FeedbackSubmission", feedbackSubmissionSchema);
