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
    url TEXT NOT NULL,
    timestamp INTEGER NOT NULL,  
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
  console.log('Received block site request:', req.body);
  
  const { url } = req.body;
  
  if (!url) {
    console.error('No URL provided');
    return res.status(400).json({ error: 'URL is required' });
  }

  // Add http:// if not present
  let formattedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    formattedUrl = 'http://' + url;
  }

  console.log('Attempting to block URL:', formattedUrl);

  db.run('INSERT INTO blocked_sites (url) VALUES (?)', [formattedUrl], function(err) {
    if (err) {
      console.error('Error blocking site:', err.message);
      res.status(500).json({ error: err.message });
    } else {
      console.log(`Successfully blocked site with ID: ${this.lastID}`);
      res.status(200).json({ 
        success: true, 
        message: 'Site blocked successfully',
        id: this.lastID,
        url: formattedUrl
      });
    }
  });
});

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

app.post('/api/track', async (req, res) => {
  const { url, timestamp } = req.body;

  // Convert timestamp to UNIX format (seconds)
  const unixTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);

  // Unnecessary URLs to be filtered out
  const unnecessaryUrls = ['http://localhost:3000/', 'chrome://newtab/'];

  if (unnecessaryUrls.includes(url)) {
    return res.status(400).json({ message: 'Unnecessary URL' });
  }

  // Check if the site is blocked
  db.get('SELECT * FROM blocked_sites WHERE url = ?', [url], async (err, row) => {
    if (err) {
      console.error('Error checking blocked sites:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.status(403).json({ message: 'This site is blocked' });
    }

    // Fetch category for the URL
    const category = await fetchCategory(url);

    // Insert data into browsing_history
    db.run(
      'INSERT INTO browsing_history (url, timestamp, category) VALUES (?, ?, ?)',
      [url, unixTimestamp, category],
      function (err) {
        if (err) {
          console.error('Error inserting into browsing_history:', err.message);
          return res.status(500).json({ error: err.message });
        }

        console.log(`Row inserted with ID: ${this.lastID}`);

        // If "Sensitive Topics", block the site
        if (category === 'Sensitive Topics') {
          // Insert into blocked_sites
          db.run('INSERT INTO blocked_sites (url) VALUES (?)', [url], (err) => {
            if (err) {
              console.error('Error inserting into blocked_sites:', err.message);
              return res.status(500).json({ error: err.message });
            }
            console.log(`Site blocked: ${url}`);
            return res.status(200).json({ message: 'Sensitive Topic Detected and Blocked' });
          });
        } else {
          res.status(200).json({ message: 'Browsing history added' });
        }
      }
    );
  });
});



app.post('/api/revocation-request', (req, res) => {
  const { url, description } = req.body;
  db.run('INSERT INTO revocation_requests (url, description) VALUES (?, ?)',
    [url, description],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(200).json({ id: this.lastID });
      }
    }
  );
});

app.get('/api/revocation-requests', (req, res) => {
  db.all('SELECT * FROM revocation_requests ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.put('/api/revocation-request/:id', (req, res) => {
  const { status, approved } = req.body;
  const { id } = req.params;
  
  db.serialize(() => {
    db.run('UPDATE revocation_requests SET status = ? WHERE id = ?',
      [status, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (approved) {
          // If approved, remove from blocked_sites
          db.get('SELECT url FROM revocation_requests WHERE id = ?', [id], (err, row) => {
            if (err || !row) {
              return res.status(500).json({ error: err ? err.message : 'Request not found' });
            }
            
            db.run('DELETE FROM blocked_sites WHERE url = ?', [row.url], (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.status(200).json({ message: 'Request processed successfully' });
            });
          });
        } else {
          res.status(200).json({ message: 'Request processed successfully' });
        }
      }
    );
  });
});

// Helper function to fetch category from the API 
const fetchCategory = async (url) => {
  try {
    const response = await fetch(`https://website-categorization.whoisxmlapi.com/api/v3?apiKey=at_7kYH5NTsKWjEsphFJ0ZpZdwhSsbp5&url=${url}`);
    const data = await response.json();
    
    // Log the entire API response
    console.log('API Response:', data);
    
    // Ensure the response has categories and it's an array with at least one element
    if (data && data.categories && data.categories.length > 0) {
      // Find the category with the highest confidence value
      const highestConfidenceCategory = data.categories.reduce((highestCategory, currentCategory) => {
        return currentCategory.confidence > highestCategory.confidence ? currentCategory : highestCategory;
      });

      return highestConfidenceCategory.name;
    } else {
      return 'Uncategorized'; // Return a default value if no categories are found
    }
  } catch (error) {
    console.error('Error fetching category:', error);
    return 'Unknown';
  }
};



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
    return "DATE(timestamp, 'unixepoch', 'localtime') = DATE('now', 'localtime')";
  } else if (period === 'weekly') {
    return "DATE(timestamp, 'unixepoch', 'localtime') >= DATE('now', '-6 days', 'localtime')";
  } else if (period === 'monthly') {
    return "strftime('%Y-%m', timestamp, 'unixepoch', 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
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
    const visits = await queryDb(`SELECT url, timestamp FROM browsing_history WHERE ${timeFilter}`);

    // Debugging: Log results to check timestamps
    console.log(`Fetched ${period} analytics:`, visits);

    // Convert timestamps to readable format for debugging
    const formattedData = visits.map(record => ({
      url: record.url,
      timestamp: new Date(record.timestamp * 1000).toLocaleString(), // Convert UNIX to readable format
    }));

    // Aggregate total visits and unique sites
    const uniqueSites = new Set(visits.map(record => new URL(record.url).hostname)).size;

    res.json({
      totalVisits: visits.length,
      uniqueSites,
      data: formattedData, // Send formatted timestamps for debugging
    });
  } catch (error) {
    console.error(`Error fetching ${period} analytics:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
