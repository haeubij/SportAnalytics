const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../utils/logger');

/**
 * @purpose Video Service REST API Routen
 * @description Videos werden als Blob in MongoDB GridFS gespeichert – kein Dateisystem.
 *
 * GridFS speichert Dateien in zwei Collections:
 *   videos.files   – Metadaten (filename, length, uploadDate, metadata)
 *   videos.chunks  – Binärdaten in 255kB-Blöcken
 *
 * Eigenes metadata-Objekt enthält: uploadedBy, title, description, sport, contentType
 */

// Multer mit Memory Storage – für multipart uploads (z.B. Postman / curl)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'videos' });
}

// @route   POST /api/videos
// @desc    Upload via JSON+Base64 (für Bruno) oder Multipart (Postman/curl)
// @access  Private
router.post('/', auth, (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('video')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    let fileBuffer, filename, contentType, title, description, sport, fileSize;

    if (req.file) {
      // Multipart upload (Postman / curl)
      fileBuffer = req.file.buffer;
      filename = req.file.originalname;
      contentType = req.file.mimetype;
      fileSize = req.file.size;
      title = req.body.title;
      description = req.body.description || '';
      sport = req.body.sport || '';
    } else {
      // JSON + Base64 upload (Bruno)
      const { data, filename: fn, contentType: ct, title: t, description: d, sport: s } = req.body;

      if (!data) {
        return res.status(400).json({ message: 'Provide either multipart file or base64 data field' });
      }

      fileBuffer = Buffer.from(data, 'base64');
      filename = fn || 'video.mp4';
      contentType = ct || 'video/mp4';
      fileSize = fileBuffer.length;
      title = t;
      description = d || '';
      sport = s || '';
    }

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        uploadedBy: req.user.id,
        title,
        description,
        sport,
        contentType,
        originalName: filename
      }
    });

    uploadStream.end(fileBuffer);

    uploadStream.on('finish', () => {
      logger.info(`Video uploaded: fileId=${uploadStream.id} title="${title}" by userId=${req.user.id}`);
      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: uploadStream.id,
          title,
          description,
          sport,
          originalName: filename,
          size: fileSize,
          contentType,
          uploadedBy: req.user.id
        }
      });
    });

    uploadStream.on('error', (err) => {
      logger.error(`GridFS upload error: ${err.message}`);
      res.status(500).json({ message: 'Upload failed' });
    });
  } catch (err) {
    logger.error(`POST /api/videos error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/videos
// @desc    List all videos (metadata only, no binary data)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();

    const videos = files.map(f => ({
      id: f._id,
      filename: f.filename,
      size: f.length,
      uploadDate: f.uploadDate,
      title: f.metadata?.title,
      description: f.metadata?.description,
      sport: f.metadata?.sport,
      contentType: f.metadata?.contentType,
      uploadedBy: f.metadata?.uploadedBy
    }));

    logger.info(`Listed ${videos.length} videos for userId=${req.user.id}`);
    res.json(videos);
  } catch (err) {
    logger.error(`GET /api/videos error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/videos/my
// @desc    List only own videos
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({ 'metadata.uploadedBy': req.user.id }).sort({ uploadDate: -1 }).toArray();

    const videos = files.map(f => ({
      id: f._id,
      filename: f.filename,
      size: f.length,
      uploadDate: f.uploadDate,
      title: f.metadata?.title,
      description: f.metadata?.description,
      sport: f.metadata?.sport,
      contentType: f.metadata?.contentType,
      uploadedBy: f.metadata?.uploadedBy
    }));

    logger.info(`Listed ${videos.length} own videos for userId=${req.user.id}`);
    res.json(videos);
  } catch (err) {
    logger.error(`GET /api/videos/my error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/videos/:id
// @desc    Get video metadata by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(req.params.id) }).toArray();

    if (!files.length) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const f = files[0];
    res.json({
      id: f._id,
      filename: f.filename,
      size: f.length,
      uploadDate: f.uploadDate,
      title: f.metadata?.title,
      description: f.metadata?.description,
      sport: f.metadata?.sport,
      contentType: f.metadata?.contentType,
      uploadedBy: f.metadata?.uploadedBy
    });
  } catch (err) {
    logger.error(`GET /api/videos/:id error: ${err.message}`);
    res.status(400).json({ message: 'Invalid video ID' });
  }
});

// @route   GET /api/videos/:id/stream
// @desc    Stream / download a video with range request support
// @access  Private
router.get('/:id/stream', auth, async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(req.params.id) }).toArray();

    if (!files.length) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const file = files[0];
    const fileSize = file.length;
    const contentType = file.metadata?.contentType || 'video/mp4';
    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });

      bucket.openDownloadStream(file._id, { start, end: end + 1 }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });

      bucket.openDownloadStream(file._id).pipe(res);
    }

    logger.info(`Streaming video fileId=${req.params.id} to userId=${req.user.id}`);
  } catch (err) {
    logger.error(`GET /api/videos/:id/stream error: ${err.message}`);
    res.status(400).json({ message: 'Invalid video ID' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video (own or admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(req.params.id) }).toArray();

    if (!files.length) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const file = files[0];

    // Only owner or admin can delete
    if (file.metadata?.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await bucket.delete(file._id);
    logger.info(`Video deleted: fileId=${req.params.id} by userId=${req.user.id}`);
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    logger.error(`DELETE /api/videos/:id error: ${err.message}`);
    res.status(400).json({ message: 'Invalid video ID' });
  }
});

// @route   GET /api/videos/admin/all
// @desc    List all videos with full metadata (admin only)
// @access  Private/Admin
router.get('/admin/all', [auth, admin], async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();

    logger.info(`Admin ${req.user.id} fetched all videos (${files.length})`);
    res.json(files.map(f => ({
      id: f._id,
      filename: f.filename,
      size: f.length,
      uploadDate: f.uploadDate,
      ...f.metadata
    })));
  } catch (err) {
    logger.error(`GET /api/videos/admin/all error: ${err.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
