const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// Add new subject
router.post('/', async (req, res) => {
  try {
    const { subjectName, totalMarks, subjectNumber, school, class: studentClass, year, semester } = req.body;

    // Validation
    if (!subjectName || !totalMarks || !subjectNumber || !school || !studentClass || !year || !semester) {
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

    // If it's a GPS school and class 5, also add to other GPS schools
    const gpsSchoolsList = ['GPS Dotar', 'GPS Tatar Syedan', 'GPS Tatar Bala', 'GPS Tatar Banda'];
    const isGPSClass5 = gpsSchoolsList.includes(school) && studentClass === 5;

    if (isGPSClass5) {
      // Add subject to all GPS schools
      const subjects = [];
      for (const gpsSchool of gpsSchoolsList) {
        try {
          const subject = new Subject({
            subjectName,
            totalMarks: parseInt(totalMarks),
            subjectNumber: parseInt(subjectNumber),
            school: gpsSchool,
            class: studentClass,
            year,
            semester
          });
          await subject.save();
          subjects.push(subject);
        } catch (error) {
          if (error.code !== 11000) {
            throw error;
          }
          // If duplicate, skip
        }
      }
      return res.status(201).json({ 
        success: true, 
        message: 'Subject added to all GPS schools successfully',
        data: subjects 
      });
    } else {
      // Regular subject addition
      const subject = new Subject({
        subjectName,
        totalMarks: parseInt(totalMarks),
        subjectNumber: parseInt(subjectNumber),
        school,
        class: studentClass,
        year,
        semester
      });

      const savedSubject = await subject.save();
      return res.status(201).json({ 
        success: true, 
        message: 'Subject added successfully',
        data: savedSubject 
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject with this number already exists for this school, class, year, and semester' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all subjects (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { school, class: studentClass, year, semester } = req.query;
    
    const filter = {};
    if (school) filter.school = school;
    if (studentClass) filter.class = parseInt(studentClass);
    if (year) filter.year = year;
    if (semester) filter.semester = semester;

    const subjects = await Subject.find(filter).sort({ subjectNumber: 1 });
    res.json({ 
      success: true, 
      count: subjects.length,
      data: subjects 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get distinct subject names (with optional filters)
router.get('/names', async (req, res) => {
  try {
    const { school, class: studentClass, year, semester } = req.query;

    const filter = {};
    if (school) filter.school = school;
    if (studentClass) filter.class = parseInt(studentClass);
    if (year) filter.year = year;
    if (semester) filter.semester = semester;

    const names = await Subject.distinct('subjectName', filter);
    names.sort((a, b) => a.localeCompare(b));

    res.json({
      success: true,
      count: names.length,
      data: names
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update subject
router.put('/:id', async (req, res) => {
  try {
    const { subjectName, totalMarks } = req.body;

    if (!subjectName || !totalMarks) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject name and total marks are required' 
      });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subject not found' 
      });
    }

    // If it's a GPS school class 5, update all GPS schools
    const gpsSchools = ['GPS Dotar', 'GPS Tatar Syedan', 'GPS Tatar Bala', 'GPS Tatar Banda'];
    const isGPSClass5 = gpsSchools.includes(subject.school) && subject.class === 5;

    if (isGPSClass5) {
      await Subject.updateMany(
        {
          school: { $in: gpsSchools },
          class: 5,
          year: subject.year,
          semester: subject.semester,
          subjectNumber: subject.subjectNumber
        },
        {
          subjectName,
          totalMarks: parseInt(totalMarks)
        }
      );
    } else {
      subject.subjectName = subjectName;
      subject.totalMarks = parseInt(totalMarks);
      await subject.save();
    }

    res.json({ 
      success: true, 
      message: 'Subject updated successfully',
      data: subject 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete subject
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subject not found' 
      });
    }

    // If it's a GPS school class 5, delete from all GPS schools
    const gpsSchools = ['GPS Dotar', 'GPS Tatar Syedan', 'GPS Tatar Bala', 'GPS Tatar Banda'];
    const isGPSClass5 = gpsSchools.includes(subject.school) && subject.class === 5;

    if (isGPSClass5) {
      await Subject.deleteMany({
        school: { $in: gpsSchools },
        class: 5,
        year: subject.year,
        semester: subject.semester,
        subjectNumber: subject.subjectNumber
      });
    } else {
      await Subject.findByIdAndDelete(req.params.id);
    }

    res.json({ 
      success: true, 
      message: 'Subject deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;

