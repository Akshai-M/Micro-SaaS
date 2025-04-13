const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const fileURLToPath = require('url').fileURLToPath;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// === MODELS ===
// Link Schema
const linkSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String,
  alias: String,
  expirationDate: Date,
  userId: String,
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const Link = mongoose.model('Link', linkSchema);

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  shortUrl: String,
  device: String,
  ip: String,
  timestamp: { type: Date, default: Date.now },
});
const Analytics = mongoose.model('Analytics', analyticsSchema);

// === AUTH ===
const hardcodedUser = {
  email: 'intern@dacoid.com',
  password: 'Test123',
  id: 'user123',
};

// === ROUTES ===
app.get('/', (req, res) => {
  res.send('Micro-SaaS Backend is running');
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email === hardcodedUser.email && password === hardcodedUser.password) {
    const token = jwt.sign({ id: hardcodedUser.id, email: hardcodedUser.email }, 'secretKey', { expiresIn: '1h' });
    return res.json({ token, user: { id: hardcodedUser.id, email: hardcodedUser.email } });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

// Create short link
app.post('/api/shorten', async (req, res) => {
  const { longUrl, alias, expirationDate, userId } = req.body;
  const shortUrl = alias || Math.random().toString(36).substring(2, 8);

  try {
    const newLink = new Link({ longUrl, shortUrl, alias, expirationDate, userId });
    await newLink.save();
    res.json({ shortUrl: `${req.protocol}://${req.get('host')}/${shortUrl}` });
  } catch (error) {
    res.status(500).json({ message: 'Error creating short link', error });
  }
});

// Redirection + analytics
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const link = await Link.findOne({ shortUrl });
    if (!link) return res.status(404).json({ message: 'Short URL not found' });

    link.clicks += 1;
    await link.save();

    const analyticsEntry = new Analytics({
      shortUrl,
      device: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date(),
    });
    analyticsEntry.save().catch(err => console.error('Error saving analytics:', err));

    res.redirect(link.longUrl);
  } catch (error) {
    res.status(500).json({ message: 'Redirection error', error });
  }
});

// Fetch all analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const links = await Link.find({}, 'longUrl shortUrl clicks createdAt expirationDate');

    const deviceStats = await Analytics.aggregate([
      { $group: { _id: { shortUrl: "$shortUrl", device: "$device" }, count: { $sum: 1 } } },
      { $group: { _id: "$_id.shortUrl", devices: { $push: { device: "$_id.device", count: "$count" } } } }
    ]);

    const deviceMap = {};
    deviceStats.forEach(item => {
      deviceMap[item._id] = item.devices;
    });

    const analytics = links.map(link => ({
      ...link.toObject(),
      devices: deviceMap[link.shortUrl] || []
    }));

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Analytics fetch error', error });
  }
});

// Search
app.get('/api/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    const filtered = await Link.find({ shortUrl: { $regex: q, $options: 'i' } });
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Search error', error });
  }
});

// Click count update
app.post('/api/click/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const link = await Link.findOne({ shortUrl });
    if (!link) return res.status(404).json({ message: 'Short URL not found' });

    link.clicks += 1;
    await link.save();

    res.json({ message: 'Click updated' });
  } catch (error) {
    res.status(500).json({ message: 'Click count error', error });
  }
});

// Device stats per URL
app.get('/api/analytics/:shortUrl/devices', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const result = await Analytics.aggregate([
      { $match: { shortUrl } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $project: { _id: 0, device: "$_id", count: 1 } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Device analytics error', error: err });
  }
});


// === Serve Frontend (React) ===
app.use(express.static(path.join(__dirname, '../micro-saas-app/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../micro-saas-app/dist/index.html'));
});


// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
