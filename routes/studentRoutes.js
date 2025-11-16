const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Add new student
router.post('/', async (req, res) => {
  try {
    const { admissionNumber, studentName, fatherName, school, class: studentClass, year, semester } = req.body;

    // Validation
    if (!admissionNumber || !studentName || !fatherName || !school || !studentClass || !year || !semester) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Validate class based on school
    const gpsSchools = ['GPS Dotar', 'GPS Tatar Syedan', 'GPS Tatar Bala', 'GPS Tatar Banda'];
    if (gpsSchools.includes(school) && studentClass !== 5) {
      return res.status(400).json({ 
        success: false, 
        error: `${school} only has class 5` 
      });
    }

    if (school === 'GHS Tatar' && (studentClass < 6 || studentClass > 8)) {
      return res.status(400).json({ 
        success: false, 
        error: 'GHS Tatar only has classes 6, 7, and 8' 
      });
    }

    // Create new student
    const student = new Student({
      admissionNumber,
      studentName,
      fatherName,
      school,
      class: studentClass,
      year,
      semester
    });

    const savedStudent = await student.save();
    res.status(201).json({ 
      success: true, 
      message: 'Student added successfully',
      data: savedStudent 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student with this admission number already exists for this school, year, and semester' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all students (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { school, class: studentClass, year, semester } = req.query;
    
    const filter = {};
    if (school) filter.school = school;
    if (studentClass) filter.class = parseInt(studentClass);
    if (year) filter.year = year;
    if (semester) filter.semester = semester;

    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      count: students.length,
      data: students 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const { admissionNumber, studentName, fatherName } = req.body;

    if (!admissionNumber || !studentName || !fatherName) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { admissionNumber, studentName, fatherName },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Student updated successfully',
      data: student 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student with this admission number already exists for this school, year, and semester' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Student deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

