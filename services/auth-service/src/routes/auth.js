const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const auth = require('../middleware/auth');
const { publishUserRegistered } = require('../messaging/publisher');
const logger = require('../utils/logger');

/**
 * @purpose Auth-Service REST API Routen
 * @description Stellt Endpunkte für Registrierung, Login, JWT-Ausstellung,
 *              Google OAuth 2.0 Authorization Code Flow und
 *              OpenID Connect Discovery / UserInfo bereit.
 */

// ── JWT helper ────────────────────────────────────────────────────────────────

/**
 * Generate an OIDC-compliant JWT for a user.
 * Claims: iss, sub, aud (OIDC core), user.id / user.role (app-specific).
 */
function generateToken(user) {
  const issuer = process.env.OIDC_ISSUER || 'http://localhost:3002';
  const payload = {
    iss: issuer,
    sub: user._id.toString(),
    aud: 'sport-analytics',
    user: {
      id: user._id.toString(),
      role: user.role
    }
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
}

// ── Google OAuth 2.0 Strategy (only registered when credentials are set) ──────

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'set-me') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3002/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = new User({
          username: profile.displayName.replace(/\s+/g, '_').toLowerCase(),
          email: profile.emails[0].value,
          password: require('crypto').randomBytes(32).toString('hex'),
          role: 'user',
          oauthProvider: 'google',
          oauthId: profile.id
        });
        await user.save();
        logger.info(`OAuth Google: new user created userId=${user._id}`);

        // Notify other services via Kafka
        try {
          await publishUserRegistered(user._id.toString(), user.username, user.email, user.role);
        } catch (kafkaErr) {
          logger.error(`Failed to publish user.registered event: ${kafkaErr.message}`);
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// ── Standard Auth Routes ──────────────────────────────────────────────────────

// @route   POST /api/auth/register
// @desc    Register a new user and issue JWT
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ username, email, password, role: 'user' });
    await user.save();

    logger.info(`New user registered: userId=${user._id} username=${username}`);

    // Notify other services via Kafka
    try {
      await publishUserRegistered(user._id.toString(), username, email, user.role);
    } catch (kafkaErr) {
      logger.error(`Failed to publish user.registered event: ${kafkaErr.message}`);
    }

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    logger.error(`POST /api/auth/register error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and issue JWT (also serves as OIDC token_endpoint)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
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
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    logger.error(`POST /api/auth/login error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`User ${req.user.id} fetched own profile via /me`);
    res.json(user);
  } catch (err) {
    logger.error(`GET /api/auth/me error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ── Google OAuth 2.0 Routes ───────────────────────────────────────────────────

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth2 Authorization Code Flow
// @access  Public
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'set-me') {
    return res.status(503).json({
      message: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.',
      docs: 'https://console.cloud.google.com/apis/credentials'
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth2 callback — issues JWT after successful authentication
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/error' }),
  (req, res) => {
    const token = generateToken(req.user);
    logger.info(`OAuth Google callback: issued JWT for userId=${req.user._id}`);
    res.json({
      token,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);

// @route   GET /api/auth/google/error
// @desc    Google OAuth2 failure redirect target
// @access  Public
router.get('/google/error', (req, res) => {
  res.status(401).json({ message: 'Google OAuth authentication failed' });
});

// ── OpenID Connect Endpoints ──────────────────────────────────────────────────

// @route   GET /api/auth/.well-known/openid-configuration
// @desc    OpenID Connect Discovery Document (RFC 8414)
// @access  Public
router.get('/.well-known/openid-configuration', (req, res) => {
  const issuer = process.env.OIDC_ISSUER || `http://localhost:${process.env.PORT || 3002}`;
  res.json({
    issuer,
    authorization_endpoint: `${issuer}/api/auth/google`,
    token_endpoint: `${issuer}/api/auth/login`,
    userinfo_endpoint: `${issuer}/api/auth/userinfo`,
    jwks_uri: `${issuer}/api/auth/.well-known/jwks.json`,
    response_types_supported: ['code', 'token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: ['openid', 'email', 'profile'],
    claims_supported: ['sub', 'email', 'name', 'iss', 'iat', 'exp']
  });
});

// @route   GET /api/auth/userinfo
// @desc    OpenID Connect UserInfo endpoint — returns claims for authenticated user
// @access  Private (Bearer token required)
router.get('/userinfo', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const issuer = process.env.OIDC_ISSUER || `http://localhost:${process.env.PORT || 3002}`;
    res.json({
      sub: user._id.toString(),
      name: user.username,
      email: user.email,
      email_verified: true,
      iss: issuer,
      role: user.role
    });
  } catch (err) {
    logger.error(`GET /api/auth/userinfo error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
