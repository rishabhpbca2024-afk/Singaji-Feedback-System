const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
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

    level: {
      type: String,
      required: true,
      enum: ["1A", "1B", "1C", "2A", "2B", "2C"],
    },
  },
  {
    timestamps: true,
    collection: "Students",
  }
);

module.exports = mongoose.model("Student", studentSchema);