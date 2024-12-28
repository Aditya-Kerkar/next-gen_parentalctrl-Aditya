const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(cors({
    origin: '*', // For development purposes. In production, specify the exact origin.
}));

// Initialize SQLite DB
const db = new sqlite3.Database('./db.sqlite');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS browsing_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    timestamp TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS blocked_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT
  )`);
});

// Get browsing history
app.get('/api/history', (req, res) => {
  db.all('SELECT * FROM browsing_history', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get blocked sites
app.get('/api/blocked-sites', (req, res) => {
  db.all('SELECT * FROM blocked_sites', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Block a site
app.post('/api/block-site', (req, res) => {
  const { url } = req.body;
  db.run('INSERT INTO blocked_sites (url) VALUES (?)', [url], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).send();
    }
  });
});

// Add to browsing history
app.post('/api/track', (req, res) => {
  const { url, timestamp } = req.body;
  db.run('INSERT INTO browsing_history (url, timestamp) VALUES (?, ?)', [url, timestamp], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).send();
    }
  });
});

// Start the server
app.listen(5000, () => {
  console.log('Backend server running on port 5000');
});
