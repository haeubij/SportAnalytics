const mongoose = require('mongoose');
const Video = require('../../models/Video');
const User = require('../../models/User');

describe('Video Model', () => {
  let testUser;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/sportanalytics_test');
    // Create a test user
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
  }, 30000);

  afterAll(async () => {
    await User.deleteOne({ _id: testUser._id });
    await mongoose.connection.close();
  }, 30000);

  it('should create a video with required fields', async () => {
    const video = new Video({
      title: 'Testvideo',
      url: '/uploads/test.mp4',
      isPublic: true,
      uploadedAt: new Date(),
      uploadedBy: testUser._id,
      filePath: '/uploads/test.mp4'
    });
    await video.save();
    expect(video.title).toBe('Testvideo');
    expect(video.url).toBe('/uploads/test.mp4');
    await Video.deleteOne({ _id: video._id });
  }, 30000);

  it('should set isPublic to false by default', async () => {
    const video = new Video({
      title: 'Testvideo2',
      url: '/uploads/test2.mp4',
      uploadedAt: new Date(),
      uploadedBy: testUser._id,
      filePath: '/uploads/test2.mp4'
    });
    await video.save();
    expect(video.isPublic).toBe(false);
    await Video.deleteOne({ _id: video._id });
  }, 30000);
}); 