const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const bcrypt = require('bcryptjs');

// @route   GET api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's videos
    const videos = await Video.find({ uploadedBy: req.params.id }).select('_id title');
    
    res.json({
      ...user._doc,
      videos
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    // Make sure not to delete the admin account that's making the request
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    // Delete user's videos
    await Video.deleteMany({ uploadedBy: req.params.id });
    
    res.json({ message: 'User and associated data deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/role
// @desc    Change user role (Admin only)
// @access  Private/Admin
router.put('/:id/role', [auth, admin], async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required' });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/status
// @desc    Toggle user active status (Admin only)
// @access  Private/Admin
router.put('/:id/status', [auth, admin], async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deactivating own admin account
    if (req.params.id === req.user.id && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate your own admin account' });
    }
    
    // Update status
    user.isActive = isActive;
    await user.save();
    
    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/password
// @desc    Reset user password (Admin only)
// @access  Private/Admin
router.put('/:id/password', [auth, admin], async (req, res) => {
  try {
    const { newPassword } = req.body;
    console.log(`Password reset attempt for user ID: ${req.params.id}`);
    
    if (!newPassword || newPassword.length < 6) {
      console.log('Password reset failed: Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    try {
      // Use the static method to reset password
      await User.resetPassword(req.params.id, newPassword);
      
      // Get the user to confirm the reset
      const user = await User.findById(req.params.id);
      console.log(`Password has been reset for user: ${user.username}`);
      
      res.json({ message: 'Password reset successful' });
    } catch (resetError) {
      console.error(`Password reset operation failed: ${resetError.message}`);
      if (resetError.message === 'User not found') {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(500).json({ message: 'Error resetting password' });
    }
  } catch (err) {
    console.error(`Password reset error: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 