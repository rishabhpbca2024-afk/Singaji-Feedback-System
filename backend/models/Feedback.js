const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    // studentGmail: Deprecated for anonymity (H-4).
    // Kept with select: false purely for legacy query safety so it is never returned.
    studentGmail: {
      type: String,
      trim: true,
      default: undefined,
      select: false,
    },

    level: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
    },

    facultyId: {
      type: String,
      required: true,
      trim: true,
    },

    facultyName: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    lectureTime: {
      type: String,
      default: '',
      trim: true,
    },

    lectureEndTime: {
      type: String,
      required: true,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    metrics: {
      Explanation: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },

      Punctuality: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },

      Engagement: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },

      Resolution: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },

      Overall: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },

    remarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    collection: 'Feedbacks',
  }
);

// Indexes for high-performance query execution (L-2)
feedbackSchema.index({ facultyId: 1, timestamp: -1 });
feedbackSchema.index({ timestamp: -1 });

// Automatically drop legacy studentGmail compound index if present in MongoDB to avoid duplicate null errors
const dropLegacyIndex = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const collection = mongoose.connection.collection('Feedbacks');
      const indexes = await collection.indexes();
      const hasLegacy = indexes.some(
        (idx) => idx.name === 'studentGmail_1_facultyId_1_subject_1_lectureEndTime_1'
      );
      if (hasLegacy) {
        await collection.dropIndex('studentGmail_1_facultyId_1_subject_1_lectureEndTime_1');
        console.log('[INDEX MIGRATION] Dropped legacy studentGmail unique index from Feedbacks.');
      }
    }
  } catch {
    // Ignore if index is already dropped or collection does not exist
  }
};

mongoose.connection.on('connected', dropLegacyIndex);
if (mongoose.connection && mongoose.connection.readyState === 1) {
  dropLegacyIndex();
}

module.exports = mongoose.model('Feedback', feedbackSchema);