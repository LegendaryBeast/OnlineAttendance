const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        // Validate SUST email format
        return /^[0-9]{10}@student\.sust\.edu$/.test(v) || /@sust\.edu$/.test(v) || /longlong4bugs@gmail\.com$/.test(v);
      },
      message: 'Email must be a valid SUST email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: function () {
      return this.role === 'student';
    },
    validate: {
      validator: function (v) {
        // If role is not student, no validation needed
        if (this.role !== 'student') return true;
        // For students, registration number must exist and be 10 digits
        return v && /^[0-9]{10}$/.test(v);
      },
      message: 'Registration number must be 10 digits'
    }
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  picture: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
