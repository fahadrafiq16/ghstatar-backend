const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

// Add or update marks
router.post('/', async (req, res) => {
  try {
    const { marks, school, class: studentClass, year, semester, subjectId } = req.body;

    if (!marks || !Array.isArray(marks) || !school || !studentClass || !year || !semester || !subjectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Get subject details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subject not found' 
      });
    }

    const results = [];
    const errors = [];

    for (const markData of marks) {
      try {
        const { studentId, admissionNumber, studentName, marksObtained } = markData;

        if (!studentId || !admissionNumber || !studentName || (marksObtained === undefined && marksObtained !== 'A' && marksObtained !== 'a')) {
          continue; // Skip invalid entries
        }

        // Handle absent (A) case
        const isAbsent = marksObtained === 'A' || marksObtained === 'a';
        const marksValue = isAbsent ? 0 : parseInt(marksObtained);

        // Validate marks don't exceed total marks (only if not absent)
        if (!isAbsent && marksValue > subject.totalMarks) {
          errors.push({
            student: studentName,
            error: `Marks (${marksObtained}) cannot exceed total marks (${subject.totalMarks})`
          });
          continue;
        }

        // Use upsert to update if exists, create if not
        const mark = await Mark.findOneAndUpdate(
          {
            studentId,
            subjectId,
            year,
            semester
          },
          {
            admissionNumber,
            studentName,
            subjectName: subject.subjectName,
            marksObtained: marksValue,
            absent: isAbsent,
            school,
            class: parseInt(studentClass),
            year,
            semester,
            updatedAt: new Date()
          },
          {
            new: true,
            upsert: true
          }
        );

        results.push(mark);
      } catch (error) {
        errors.push({
          student: markData.studentName || 'Unknown',
          error: error.message
        });
      }
    }

    res.status(201).json({ 
      success: true, 
      message: `Marks saved for ${results.length} student(s)`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get marks (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { school, class: studentClass, year, semester, subjectId, studentId } = req.query;
    
    const filter = {};
    if (school) filter.school = school;
    if (studentClass) filter.class = parseInt(studentClass);
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (subjectId) filter.subjectId = subjectId;
    if (studentId) filter.studentId = studentId;

    const marks = await Mark.find(filter)
      .populate('studentId', 'admissionNumber studentName fatherName')
      .populate('subjectId', 'subjectName totalMarks subjectNumber')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      count: marks.length,
      data: marks 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get marks for a specific subject and class
router.get('/subject-class', async (req, res) => {
  try {
    const { school, class: studentClass, year, semester, subjectId } = req.query;
    
    if (!school || !studentClass || !year || !semester || !subjectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'School, class, year, semester, and subjectId are required' 
      });
    }

    // Get all students for this class
    const students = await Student.find({
      school,
      class: parseInt(studentClass),
      year,
      semester
    }).sort({ admissionNumber: 1 });

    // Get existing marks for this subject
    const marks = await Mark.find({
      school,
      class: parseInt(studentClass),
      year,
      semester,
      subjectId
    });

    // Create a map of studentId to marks and absent status
    const marksMap = {};
    marks.forEach(mark => {
      marksMap[mark.studentId.toString()] = {
        marksObtained: mark.marksObtained,
        absent: mark.absent || false
      };
    });

    // Combine students with their marks
    const studentsWithMarks = students.map(student => {
      const markData = marksMap[student._id.toString()];
      return {
        student: {
          _id: student._id,
          admissionNumber: student.admissionNumber,
          studentName: student.studentName,
          fatherName: student.fatherName
        },
        marksObtained: markData ? markData.marksObtained : null,
        absent: markData ? markData.absent : false
      };
    });

    res.json({ 
      success: true, 
      count: studentsWithMarks.length,
      data: studentsWithMarks 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update mark
router.put('/:id', async (req, res) => {
  try {
    const { marksObtained } = req.body;

    if (marksObtained === undefined || (marksObtained === null && marksObtained !== 'A' && marksObtained !== 'a')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Marks obtained is required' 
      });
    }

    const mark = await Mark.findById(req.params.id).populate('subjectId');
    if (!mark) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mark not found' 
      });
    }

    // Handle absent (A) case
    const isAbsent = marksObtained === 'A' || marksObtained === 'a';
    const marksValue = isAbsent ? 0 : parseInt(marksObtained);

    // Validate marks don't exceed total marks (only if not absent)
    if (!isAbsent && marksValue > mark.subjectId.totalMarks) {
      return res.status(400).json({ 
        success: false, 
        error: `Marks (${marksObtained}) cannot exceed total marks (${mark.subjectId.totalMarks})` 
      });
    }

    mark.marksObtained = marksValue;
    mark.absent = isAbsent;
    mark.updatedAt = new Date();
    await mark.save();

    res.json({ 
      success: true, 
      message: 'Mark updated successfully',
      data: mark 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete mark
router.delete('/:id', async (req, res) => {
  try {
    const mark = await Mark.findByIdAndDelete(req.params.id);

    if (!mark) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mark not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Mark deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

