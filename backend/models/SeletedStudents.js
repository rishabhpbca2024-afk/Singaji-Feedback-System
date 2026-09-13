const mongoose = require("mongoose");

const selectedStudentsSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
    },

    level: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    gmail: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "SelectedStudents",
  }
);

module.exports = mongoose.model(
  "SelectedStudents",
  selectedStudentsSchema
);