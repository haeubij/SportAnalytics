const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { publishUserRegistered } = require('../messaging/publisher');
const logger = require('../utils/logger');

/**
 * @purpose Auth Service REST API Routen
 * @description Registrierung, Login und Token-Validierung.
 *
 * JWT-Payload-Struktur: { user: { id, role } }
 * → req.user.id und req.user.role funktionieren im User Service ohne Änderungen.
 */

function generateToken(user) {
  const payload = {
    user: {
      id: user._id.toString(),
      role: user.role
    }
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      return res.status(409).json({ message: 'Username already taken' });
    }

    const user = new User({
      username,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user'
    });

    await user.save();
    logger.info(`New user registered: userId=${user._id} username=${user.username}`);

    // Publish event so User Service can sync the user profile
    try {
      await publishUserRegistered(user._id.toString(), user.username, user.email, user.role);
    } catch (kafkaErr) {
      logger.error(`Failed to publish user.registered event: ${kafkaErr.message}`);
      // Don't fail the request if Kafka is down
    }

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    logger.error(`POST /api/auth/register error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login with email and password, returns JWT
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: userId=${user._id} username=${user.username}`);

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    logger.error(`POST /api/auth/login error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile (requires valid token)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`User ${req.user.id} fetched own auth profile`);
    res.json(user);
  } catch (err) {
    logger.error(`GET /api/auth/me error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
