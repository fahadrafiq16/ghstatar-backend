const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  admissionNumber: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
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

// Compound index to ensure unique admission number per school, year, and semester
studentSchema.index({ admissionNumber: 1, school: 1, year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);

