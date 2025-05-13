const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const auth = require('../middleware/auth');

// NOTE: The public videos route is now handled directly in server.js
// This route is kept here as reference but is no longer used
/*
// @route   GET api/videos/public
// @desc    Get all public videos
// @access  Public (no auth required)
router.get('/public', async (req, res) => {
  try {
    console.log('Fetching public videos');
    const videos = await Video.find({ isPublic: true })
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 });
    console.log(`Found ${videos.length} public videos`);
    res.json(videos);
  } catch (err) {
    console.error('Error fetching public videos:', err.message);
    res.status(500).send('Server error');
  }
});
*/

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, and OGG videos are allowed.'));
    }
  }
}).single('video');

// @route   POST api/videos/upload
// @desc    Upload a video
// @access  Private
router.post('/upload', auth, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message });
    }
    
    try {
      console.log('Upload request received:');
      console.log('req.body:', req.body);
      console.log('req.file:', req.file ? { 
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype 
      } : 'No file');
      
      if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded' });
      }

      // Extract clean title from filename if no title is provided
      let videoTitle = req.body.title;
      if (!videoTitle) {
        // Get filename without extension and replace underscores/hyphens with spaces
        const filename = req.file.originalname;
        videoTitle = filename.split('.').slice(0, -1).join('.')
          .replace(/_/g, ' ').replace(/-/g, ' ');
      }

      const video = new Video({
        title: videoTitle,
        description: req.body.description || '',
        url: `/uploads/${req.file.filename}`,
        filePath: req.file.path,
        uploadedBy: req.user.id,
        isPublic: req.body.isPublic === 'true'
      });

      console.log('Creating video with title:', video.title);
      await video.save();
      res.json(video);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
});

// @route   GET api/videos
// @desc    Get all videos for current user (or all for admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Wenn Benutzer Admin ist, alle Videos zurückgeben
    // Ansonsten nur eigene Videos
    const query = req.user.role === 'admin' ? {} : { uploadedBy: req.user.id };
    
    console.log('User requesting videos:', req.user.id, 'Role:', req.user.role);
    console.log('Using query:', query);
    
    const videos = await Video.find(query)
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 });
      
    console.log(`Found ${videos.length} videos for user`);
    res.json(videos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/videos/:id
// @desc    Get video by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'username');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json(video);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/videos/:id
// @desc    Delete a video
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if user owns the video or is admin
    if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete video file
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }
    
    // Delete video from database
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Video removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 