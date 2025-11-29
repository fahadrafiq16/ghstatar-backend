const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    // NOTE: For this small internal tool we store the password in plain text
    // so that it can be emailed in the "forgot password" flow exactly as requested.
    // Do NOT reuse these credentials anywhere else.
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);


