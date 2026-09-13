const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    gmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      required: true,
      enum: ["ITEG", "MEG", "BEG", "B.Tech"],
    },

    subjects: {
      type: [String],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "Faculties",
  }
);

module.exports = mongoose.model("Faculty", facultySchema);