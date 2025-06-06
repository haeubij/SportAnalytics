const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @author Manuel Affolter
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose User-Modell für Benutzerdaten und Authentifizierung
 * @description Definiert das Mongoose-Schema für Benutzer, inkl. Passwort-Hashing und Methoden für Authentifizierung und Passwort-Reset.
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
    console.log(`Hashing password for user: ${this.username}`);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`Password hashed successfully for: ${this.username}`);
    next();
  } catch (error) {
    console.error(`Error hashing password: ${error.message}`);
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log(`Comparing password for user: ${this.username}`);
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log(`Password comparison result: ${result}`);
  return result;
};

// Static method to reset a user's password
userSchema.statics.resetPassword = async function(userId, newPassword) {
  console.log(`Using static method to reset password for user ID: ${userId}`);
  
  try {
    const user = await this.findById(userId);
    
    if (!user) {
      console.log('User not found in resetPassword method');
      throw new Error('User not found');
    }
    
    // Set the new password
    user.password = newPassword;
    
    // Save the user with the new password
    await user.save();
    
    console.log(`Password reset successful via static method for: ${user.username}`);
    return true;
  } catch (error) {
    console.error(`Error in resetPassword method: ${error.message}`);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema); 