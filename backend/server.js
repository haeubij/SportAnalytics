const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose Hauptserver der Anwendung
 * @description Initialisiert Express, verbindet mit MongoDB und stellt zentrale API-Endpunkte bereit.
 */

// Load environment variables
dotenv.config();

// Modelle direkt laden, um Probleme mit dem Ladevorgang zu vermeiden
const Video = require('./models/Video');
const User = require('./models/User');

// Create Express app
const app = express();

// Maximale Toleranz für CORS - alle Anfragen erlauben
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  if (req.url.includes('/public')) {
    console.log('Public request detected');
  }
  next();
});

// Connect to MongoDB
let isMongoConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sport-analytics')
  .then(() => {
    console.log('Connected to MongoDB');
    isMongoConnected = true;
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Server will continue to run but database-dependent features may not work');
    isMongoConnected = false;
  });

// WICHTIG: Öffentliche Route für Videos - KEINE AUTH ERFORDERLICH
// Muss VOR allen anderen Routes stehen
app.get('/api/videos/public', async (req, res) => {
  console.log('>>> Public videos route accessed');
  
  // Explizite CORS-Header für maximale Kompatibilität
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-auth-token');
  
  // OPTIONS-Anfragen sofort beantworten
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Prüfe ob MongoDB verbunden ist
    if (!isMongoConnected) {
      console.error('MongoDB not connected - cannot fetch videos');
      return res.status(503).json({ 
        message: 'Database service unavailable',
        videos: [] 
      });
    }

    console.log('Fetching public videos from database...');
    const videos = await Video.find({ isPublic: true })
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 });
      
    console.log(`Found ${videos.length} public videos`);
    return res.json(videos);
  } catch (err) {
    console.error('Error fetching public videos:', err.message);
    console.error(err.stack);
    
    // Auch bei Fehler eine leere Array statt 500 zurückgeben
    return res.json([]);
  }
});

// Rest der API-Routen
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/users', require('./routes/users'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`MongoDB Status: ${isMongoConnected ? 'Connected' : 'Not Connected'}`);
    console.log(`Public videos available at: http://localhost:${PORT}/api/videos/public`);
  });
}

module.exports = app; 