const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  subjectNumber: {
    type: Number,
    required: true,
    min: 1
  },
  school: {
    type: String,
    required: true,
    enum: ['GPS Dotar', 'GPS Tatar Syedan', 'GPS Tatar Bala', 'GPS Tatar Banda', 'GHS Tatar']
  },
  class: {
    type: Number,
    required: true,
    min: 5,
    max: 8
  },
  year: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['Spring', 'Fall']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique subject number per school, class, year, and semester
subjectSchema.index({ subjectNumber: 1, school: 1, class: 1, year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);

