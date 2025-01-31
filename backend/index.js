const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express app
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite DB
const db = new sqlite3.Database('./db.sqlite');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS browsing_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    timestamp TEXT,
    category TEXT
  )`, (err) => { 
    if (err) { 
      console.error('Error creating browsing_history table:', err.message); 
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS blocked_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT
  )`, (err) => { 
    if (err) { 
      console.error('Error creating blocked_sites table:', err.message); 
    } 
  }); 

  db.run(`CREATE TABLE IF NOT EXISTS revocation_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating revocation_requests table:', err.message);
    }
  });
});

// Helper to convert SQLite query results to JSON format
const queryDb = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Analytics Route: Get total browsing entries and category breakdown
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const totalHistoryCount = await queryDb('SELECT COUNT(*) as total FROM browsing_history');
    const categoryBreakdown = await queryDb(
      'SELECT category, COUNT(*) as count FROM browsing_history GROUP BY category'
    );
    
    res.json({
      totalEntries: totalHistoryCount[0].total,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Analytics Route: Get browsing trends by day
app.get('/api/analytics/daily-trends', async (req, res) => {
  try {
    const dailyTrends = await queryDb(
      `SELECT DATE(timestamp) as date, COUNT(*) as count 
       FROM browsing_history 
       GROUP BY DATE(timestamp) 
       ORDER BY date ASC`
    );
    res.json(dailyTrends);
  } catch (error) {
    console.error('Error fetching daily trends:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Analytics Route: Get top visited URLs
app.get('/api/analytics/top-urls', async (req, res) => {
  try {
    const topUrls = await queryDb(
      `SELECT url, COUNT(*) as count 
       FROM browsing_history 
       GROUP BY url 
       ORDER BY count DESC 
       LIMIT 10`
    );
    res.json(topUrls);
  } catch (error) {
    console.error('Error fetching top URLs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Analytics Route: Get category-wise browsing history
app.get('/api/analytics/category-history', async (req, res) => {
  try {
    const categoryHistory = await queryDb(
      `SELECT category, url, timestamp 
       FROM browsing_history 
       ORDER BY timestamp DESC`
    );
    res.json(categoryHistory);
  } catch (error) {
    console.error('Error fetching category history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(5000, () => {
  console.log('Backend server running on port 5000');
});

const moment = require('moment'); // Ensure moment.js is installed for date handling

const getTimeFilter = (period) => {
  if (period === 'daily') {
    return "DATE(timestamp, 'unixepoch') = DATE('now', 'localtime')"; // Convert timestamp to local date
  } else if (period === 'weekly') {
    return "DATE(timestamp, 'unixepoch') >= DATE('now', '-6 days', 'localtime')";
  } else if (period === 'monthly') {
    return "strftime('%Y-%m', timestamp, 'unixepoch') = strftime('%Y-%m', 'now', 'localtime')";
  }
  return null;
};

// Fetch analytics data for daily, weekly, and monthly
app.get('/api/analytics/:period', async (req, res) => {
  const { period } = req.params;
  const timeFilter = getTimeFilter(period);

  if (!timeFilter) {
    return res.status(400).json({ error: 'Invalid period' });
  }

  try {
    const visits = await queryDb(`SELECT url FROM browsing_history WHERE ${timeFilter}`);

    // Aggregate total visits and unique sites
    const uniqueSites = new Set(visits.map(record => new URL(record.url).hostname)).size;

    res.json({
      totalVisits: visits.length,
      uniqueSites,
      data: visits, // Send raw data for frontend processing
    });
  } catch (error) {
    console.error(`Error fetching ${period} analytics:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});