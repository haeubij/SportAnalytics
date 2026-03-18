const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @author Manuel Affolter (adapted for User Service Microservice)
 * @version 2.0.0
 * @purpose User-Modell für den User Service
 * @description Mongoose-Schema für Benutzer mit Passwort-Hashing und Vergleichsmethode.
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to reset a user's password
userSchema.statics.resetPassword = async function(userId, newPassword) {
  const user = await this.findById(userId);
  if (!user) throw new Error('User not found');
  user.password = newPassword;
  await user.save();
  return true;
};

module.exports = mongoose.model('User', userSchema);
