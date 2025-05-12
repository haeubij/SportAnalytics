import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());

const mongoURI = 'mongodb://localhost:27017/sportanalytics';

// GridFS Storage
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: 'videos',
    };
  },
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const conn = mongoose.connection;

let gfs;
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'videos' });
  console.log('MongoDB connected');
});

const JWT_SECRET = 'supersecretkey';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

app.use(express.json());

// Registrierung
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hash });
    res.json({ message: 'User registered' });
  } catch (e) {
    res.status(400).json({ message: 'User already exists' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Auth-Middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Video Upload Endpoint
app.post('/api/upload', auth, upload.single('video'), (req, res) => {
  res.json({ file: req.file });
});

// List Videos Endpoint
app.get('/api/videos', auth, async (req, res) => {
  gfs.find().toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No videos found' });
    }
    res.json(files);
  });
});

// Stream Video Endpoint
app.get('/api/video/:id', auth, (req, res) => {
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  gfs.find({ _id: fileId }).toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No video found' });
    }
    res.set('Content-Type', files[0].contentType);
    gfs.openDownloadStream(fileId).pipe(res);
  });
});

// Delete Video Endpoint
app.delete('/api/video/:id', auth, (req, res) => {
  const fileId = new mongoose.Types.ObjectId(req.params.id);
  gfs.delete(fileId, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting video' });
    }
    res.json({ message: 'Video deleted' });
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`)); 