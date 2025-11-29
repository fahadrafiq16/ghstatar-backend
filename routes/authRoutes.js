const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const JWT_EXPIRES_IN = '7d';

// Helper: ensure there is always an admin document with default credentials
async function ensureDefaultAdmin() {
  const existing = await Admin.findOne();
  if (!existing) {
    await Admin.create({
      username: 'admin',
      password: 'admin',
    });
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    await ensureDefaultAdmin();
    const admin = await Admin.findOne();

    if (!admin || admin.username !== username || admin.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: admin._id.toString(),
        username: admin.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      admin: {
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/auth/admin - get current admin credentials (only username)
router.get('/admin', async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const admin = await Admin.findOne().select('username');
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/auth/admin - update username/password
router.put('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    await ensureDefaultAdmin();
    const admin = await Admin.findOne();
    admin.username = username;
    admin.password = password;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      admin: { username: admin.username },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/forgot-password - email current credentials
router.post('/forgot-password', async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const admin = await Admin.findOne();

    const toEmail = 'Fahadrafiq16@gmail.com';

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment.');
      return res.status(500).json({
        success: false,
        error: 'Email service is not configured on the server',
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: 'Ghstatar Admin Login Details',
      text: `Here are your current admin login details:\n\nUsername: ${admin.username}\nPassword: ${admin.password}\n\nPlease keep these credentials safe.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Login details have been emailed to ${toEmail}`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

module.exports = router;


