const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @purpose User-Modell für den Auth Service
 * @description Mongoose-Schema für Benutzer mit Passwort-Hashing, Vergleichsmethode
 *              und optionalen OAuth-Feldern für Google OAuth2 / OpenID Connect.
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
  // OAuth 2.0 / OpenID Connect fields
  oauthProvider: {
    type: String,
    enum: ['google', null],
    default: null
  },
  oauthId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (skip if already hashed via OAuth random password)
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

module.exports = mongoose.model('User', userSchema);
