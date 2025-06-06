jest.useRealTimers();
jest.setTimeout(30000);

const mongoose = require('mongoose');
const Video = require('../../models/Video');
const User = require('../../models/User');

describe('Video Model', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
  });

  afterEach(async () => {
    await Video.deleteMany({});
    await User.deleteMany({});
  });

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
  });

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
  });
}); 