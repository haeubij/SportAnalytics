const mongoose = require('mongoose');

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 14.05.2024 (KW20)
 * @purpose Video-Modell für Videodatenbank
 * @description Definiert das Mongoose-Schema für Videos, inkl. Metadaten, Uploader und Sichtbarkeit.
 */
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Video', videoSchema); 