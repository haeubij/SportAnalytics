const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Y4Y4i)Dhv>0<';
const ADMIN_EMAIL = 'admin@sportanalytics.com';

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Prevent registering with reserved admin username
    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      return res.status(400).json({ message: 'This username is reserved' });
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for user: ${username}`);

    // Special admin login with fixed credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log('Admin login attempt with correct credentials');
      
      // Check if admin user exists in database
      let adminUser = await User.findOne({ username: ADMIN_USERNAME });
      
      // If admin doesn't exist yet, create it
      if (!adminUser) {
        console.log('Creating new admin user');
        adminUser = new User({
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          password: await bcrypt.hash(ADMIN_PASSWORD, 10),
          role: 'admin'
        });
        
        await adminUser.save();
      } else if (adminUser.role !== 'admin') {
        // Ensure the admin user has admin role
        console.log('Updating existing user to admin role');
        adminUser.role = 'admin';
        await adminUser.save();
      }
      
      // Update last login
      adminUser.lastLogin = new Date();
      await adminUser.save();
      
      // Create JWT token for admin
      const payload = {
        user: {
          id: adminUser.id,
          role: 'admin'
        }
      };
      
      console.log('Creating admin token with payload:', payload);
      
      return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          console.log('Admin token created successfully');
          res.json({ token });
        }
      );
    }

    // Normal user login flow
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`User found: ${username}, checking password`);
    // Check password
    const isMatch = await user.comparePassword(password);
    console.log(`Password match result: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.isActive === false) {
      console.log(`User account is deactivated: ${username}`);
      return res.status(403).json({ message: 'Account is deactivated. Please contact an administrator.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log(`Login successful for user: ${username}`);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/check-username/:username
// @desc    Check if username exists
// @access  Public
router.get('/check-username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    // Don't let users know the admin username exists
    if (req.params.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      return res.json({ exists: true, message: 'This username is reserved' });
    }
    
    res.json({ exists: !!user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/check-admin
// @desc    Check if current user is admin
// @access  Private
router.get('/check-admin', auth, async (req, res) => {
  try {
    console.log('Admin check request for user:', req.user.id);
    console.log('User role from token:', req.user.role);
    
    const user = await User.findById(req.user.id).select('role');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User role from database:', user.role);
    
    const isAdmin = user.role === 'admin';
    res.json({ isAdmin });
  } catch (err) {
    console.error('Error checking admin status:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/create-admin
// @desc    Create admin user or set existing user as admin
// @access  Admin only
router.post('/create-admin', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // Create or update admin user with fixed credentials
    let admin = await User.findOne({ username: ADMIN_USERNAME });
    
    if (admin) {
      // Update existing admin
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      
      return res.json({ message: 'Admin user updated successfully' });
    }
    
    // Create new admin user with fixed credentials
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    admin = new User({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin'
    });
    
    await admin.save();
    res.json({ message: 'Admin user created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 