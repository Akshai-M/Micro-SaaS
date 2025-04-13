const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://mylapuramakshaikumar:Akshai@cluster0.aov0p6q.mongodb.net/employee', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Hardcoded user for authentication
const hardcodedUser = {
  email: 'intern@dacoid.com',
  password: 'Test123',
  id: 'user123',
};

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

// Routes
app.get('/', (req, res) => {
  res.send('Micro-SaaS Backend is running');
});

// Authentication Route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email === hardcodedUser.email && password === hardcodedUser.password) {
    const token = jwt.sign({ id: hardcodedUser.id, email: hardcodedUser.email }, 'secretKey', { expiresIn: '1h' });
    return res.json({ token, user: { id: hardcodedUser.id, email: hardcodedUser.email } });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

// Route to create a short link
app.post('/api/shorten', async (req, res) => {
  const { longUrl, alias, expirationDate, userId } = req.body;

  // Generate a random short URL if alias is not provided
  const shortUrl = alias || Math.random().toString(36).substring(2, 8);

  try {
    const newLink = new Link({
      longUrl,
      shortUrl,
      alias,
      expirationDate,
      userId,
    });

    await newLink.save();
    res.json({ shortUrl: `http://localhost:${PORT}/${shortUrl}` });
  } catch (error) {
    res.status(500).json({ message: 'Error creating short link', error });
  }
});

// Route to handle redirection and log analytics
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const link = await Link.findOne({ shortUrl });

    if (!link) {
      return res.status(404).json({ message: 'Short URL not found' });
    }

    // Increment click count asynchronously
    link.clicks += 1;
    await link.save();

    // Log analytics data asynchronously
    const analyticsData = {
      shortUrl,
      device: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date(),
    };
    const analyticsEntry = new Analytics(analyticsData);
    analyticsEntry.save().catch((error) => console.error('Error logging analytics:', error));

    res.redirect(link.longUrl);
  } catch (error) {
    res.status(500).json({ message: 'Error handling redirection', error });
  }
});

// Route to fetch analytics data
// Route to fetch analytics data with device breakdown
app.get('/api/analytics', async (req, res) => {
  try {
    const links = await Link.find({}, 'longUrl shortUrl clicks createdAt expirationDate');

    const deviceStats = await Analytics.aggregate([
      {
        $group: {
          _id: { shortUrl: "$shortUrl", device: "$device" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.shortUrl",
          devices: {
            $push: {
              device: "$_id.device",
              count: "$count"
            }
          }
        }
      }
    ]);

    const deviceStatsMap = {};
    deviceStats.forEach(item => {
      deviceStatsMap[item._id] = item.devices;
    });

    const analytics = links.map(link => ({
      ...link.toObject(),
      devices: deviceStatsMap[link.shortUrl] || []
    }));

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics data', error });
  }
});

// Route to search short URL (new route added)
app.get('/api/search', async (req, res) => {
  const searchTerm = req.query.q || ''; // Get the search term from the query string

  try {
    const filteredLinks = await Link.find({
      shortUrl: { $regex: searchTerm, $options: 'i' }, // Case-insensitive search for shortUrl
    });

    res.json(filteredLinks); // Return filtered links
  } catch (error) {
    res.status(500).json({ message: 'Error searching short URL', error });
  }
});

// Add a new route to handle click counting
app.post('/api/click/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;

  try {
    const link = await Link.findOne({ shortUrl });

    if (!link) {
      return res.status(404).json({ message: 'Short URL not found' });
    }

    // Increment click count
    link.clicks += 1;
    await link.save();

    res.status(200).json({ message: 'Click count updated successfully' });
  } catch (error) {
    console.error('Error updating click count:', error);
    res.status(500).json({ message: 'Error updating click count', error });
  }
});

app.get('/api/analytics/:shortUrl/devices', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const result = await Analytics.aggregate([
      { $match: { shortUrl } },
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          device: "$_id",
          count: 1
        }
      }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching device stats', error: err });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
