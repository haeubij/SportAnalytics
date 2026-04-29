const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { publishUserDeleted } = require('../messaging/publisher');
const logger = require('../utils/logger');

/**
 * Idempotenz-Analyse für User Service Endpoints:
 *
 * NATÜRLICH IDEMPOTENT (keine Middleware nötig):
 *   GET    /api/users          → lesen
 *   PUT    /api/users/:id      → gleiche Daten = gleiche DB, sicher wiederholbar
 *   PUT    /api/users/:id/role → gleiche Rolle = keine Änderung
 *   DELETE /api/users/:id      → zweiter Aufruf gibt 404, kein Datenverlust
 *
 * IDEMPOTENT DURCH BUSINESS-LOGIK (auth-service):
 *   POST /api/auth/register    → 409 Conflict bei Duplikat (email/username unique)
 *
 * IDEMPOTENT DURCH X-Idempotency-Key HEADER:
 *   Alle POST-Requests auf diesem Service unterstützen
 *   X-Idempotency-Key für explizite Idempotenz-Garantie.
 */

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    logger.info(`Admin ${req.user.id} fetched all users (${users.length})`);
    res.json(users);
  } catch (err) {
    logger.error(`GET /api/users error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/users/me
// @desc    Get own profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`User ${req.user.id} fetched own profile`);
    res.json(user);
  } catch (err) {
    logger.error(`GET /api/users/me error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private/Admin
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Admin ${req.user.id} fetched user ${req.params.id}`);
    res.json(user);
  } catch (err) {
    logger.error(`GET /api/users/:id error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (own profile or admin)
router.put('/:id', auth, async (req, res) => {
  try {
    // Only allow editing own profile unless admin
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { username, email } = req.body;
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`User ${req.params.id} profile updated by ${req.user.id}`);
    res.json(user);
  } catch (err) {
    logger.error(`PUT /api/users/:id error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Change user role (admin only)
// @access  Private/Admin
router.put('/:id/role', [auth, admin], async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (user | admin)' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    logger.info(`Admin ${req.user.id} changed role of user ${req.params.id} to ${role}`);
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    logger.error(`PUT /api/users/:id/role error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Toggle user active status (admin only)
// @access  Private/Admin
router.put('/:id/status', [auth, admin], async (req, res) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive field is required' });
    }

    // Prevent deactivating own admin account
    if (req.params.id === req.user.id && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate your own admin account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`Admin ${req.user.id} set isActive=${isActive} for user ${req.params.id}`);
    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    logger.error(`PUT /api/users/:id/status error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user and publish user.deleted event
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    logger.info(`Admin ${req.user.id} deleted user ${req.params.id} (${user.username})`);

    // Publish event so Video Service can clean up
    try {
      await publishUserDeleted(req.params.id, user.username);
    } catch (kafkaErr) {
      logger.error(`Failed to publish user.deleted event: ${kafkaErr.message}`);
      // Don't fail the request if Kafka is down – user is already deleted
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error(`DELETE /api/users/:id error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
