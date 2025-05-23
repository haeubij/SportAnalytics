const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/sportanalytics_test');
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  }, 30000);

  it('should hash password before saving', async () => {
    const user = new User({ username: 'test', email: 't@t.de', password: 'password123', role: 'user' });
    await user.save();
    expect(user.password).not.toBe('password123');
    await User.deleteOne({ _id: user._id });
  }, 30000);

  it('should compare password correctly', async () => {
    const user = new User({ username: 'test2', email: 't2@t.de', password: 'password123', role: 'user' });
    await user.save();
    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
    await User.deleteOne({ _id: user._id });
  }, 30000);

  it('should change role', async () => {
    const user = new User({ username: 'test3', email: 't3@t.de', password: 'password123', role: 'user' });
    await user.save();
    user.role = 'admin';
    await user.save();
    const found = await User.findById(user._id);
    expect(found.role).toBe('admin');
    await User.deleteOne({ _id: user._id });
  }, 30000);

  it('should toggle isActive', async () => {
    const user = new User({ username: 'test4', email: 't4@t.de', password: 'password123', role: 'user', isActive: true });
    await user.save();
    user.isActive = false;
    await user.save();
    const found = await User.findById(user._id);
    expect(found.isActive).toBe(false);
    await User.deleteOne({ _id: user._id });
  }, 30000);
}); 