const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    studentGmail: {
      type: String,
      required: true,
      trim: true,
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
feedbackSchema.index({ studentGmail: 1, timestamp: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);