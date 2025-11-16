const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  admissionNumber: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  absent: {
    type: Boolean,
    default: false
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique marks per student and subject
markSchema.index({ studentId: 1, subjectId: 1, year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);

