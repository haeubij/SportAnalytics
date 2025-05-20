const mongoose = require('mongoose');
const Video = require('./Video');

describe('Video Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/sportanalytics_test');
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a video with required fields', async () => {
    const video = new Video({
      title: 'Testvideo',
      url: '/uploads/test.mp4',
      isPublic: true,
      uploadedAt: new Date()
    });
    await video.save();
    expect(video.title).toBe('Testvideo');
    expect(video.url).toBe('/uploads/test.mp4');
    await Video.deleteOne({ _id: video._id });
  });

  it('should set isPublic to false by default', async () => {
    const video = new Video({
      title: 'Testvideo2',
      url: '/uploads/test2.mp4',
      uploadedAt: new Date()
    });
    await video.save();
    expect(video.isPublic).toBe(false);
    await Video.deleteOne({ _id: video._id });
  });
}); 