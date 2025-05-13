/**
 * Test script for verifying login functionality
 * Run with: node test-login.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sportanalytics';

// Test username and password
const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'testpassword123';

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if test user exists
    let testUser = await User.findOne({ username: TEST_USERNAME });
    
    if (!testUser) {
      console.log(`Creating test user: ${TEST_USERNAME}`);
      
      // Create a test user
      testUser = new User({
        username: TEST_USERNAME,
        email: 'testuser@example.com',
        password: TEST_PASSWORD,
        role: 'user'
      });
      
      await testUser.save();
      console.log('Test user created');
    } else {
      console.log('Test user already exists, resetting password');
      
      // Reset the password using our static method
      await User.resetPassword(testUser._id, TEST_PASSWORD);
      
      // Refetch the user
      testUser = await User.findOne({ username: TEST_USERNAME });
    }

    // Now try to login with the password
    console.log('Testing password comparison...');
    const isMatch = await testUser.comparePassword(TEST_PASSWORD);
    console.log(`Password comparison result: ${isMatch}`);
    
    if (isMatch) {
      console.log('✅ LOGIN SUCCESSFUL - Password comparison works correctly');
    } else {
      console.log('❌ LOGIN FAILED - Password comparison does not work');
      console.log('Stored password hash:', testUser.password);
      
      // Try direct bcrypt comparison
      const directCompare = await bcrypt.compare(TEST_PASSWORD, testUser.password);
      console.log(`Direct bcrypt comparison: ${directCompare}`);
    }

    // Test a wrong password
    const wrongMatch = await testUser.comparePassword('wrongpassword');
    console.log(`Wrong password result: ${wrongMatch} (should be false)`);

    console.log('Test completed');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
main(); 