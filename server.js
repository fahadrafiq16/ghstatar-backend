const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect("mongodb+srv://fahadrafiq16:xtA7llHiJCPF7tL5@cluster0.nyxio.mongodb.net/ghstatar")
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const markRoutes = require('./routes/markRoutes');

app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/marks', markRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Ghstatar API' });
});

// Health check route to verify MongoDB connectivity
app.get('/api/health', async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    if (state !== 1) {
      return res.status(200).json({ success: false, connected: false, state });
    }

    // Attempt a ping when connected
    let pingOk = false;
    try {
      const admin = mongoose.connection.db.admin();
      const result = await admin.ping();
      pingOk = result && result.ok === 1;
    } catch (e) {
      pingOk = false;
    }

    return res.status(200).json({ success: pingOk, connected: true, state, pingOk });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
