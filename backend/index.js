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
    timestamp TEXT,
    category TEXT
  )`, (err) => { if (err) { 
    console.error('Error creating browsing_history table:', err.message); 
  }
  });
  db.run(`CREATE TABLE IF NOT EXISTS blocked_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT
  )`, (err) => { if (err) { 
    console.error('Error creating blocked_sites table:', err.message); 
  } }); 
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


// Add to browsing history
app.post('/api/track', async (req, res) => {
  const { url, timestamp } = req.body;

  // Unnecessary URLs to be filtered out
  const unnecessaryUrls = ['http://localhost:3000/', 'chrome://newtab/'];

  // Check if the URL is unnecessary
  if (unnecessaryUrls.includes(url)) {
    return res.status(400).json({ message: 'Unnecessary URL' });
  }

  const category = await fetchCategory(url);

  // Check if the category is "Sensitive Topics"
  if (category === 'Sensitive Topics') {
    // Store the URL with "Sensitive Topics" category in browsing_history
    db.run('INSERT INTO browsing_history (url, timestamp, category) VALUES (?, ?, ?)', [url, timestamp, category], function(err) {
      if (err) {
        console.error('Error inserting into browsing_history:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Sensitive Topic URL inserted with ID: ${this.lastID}`);
      // Block the site by redirecting
      return res.status(200).json({ message: 'Sensitive Topic Detected' });
    });
  } else {
    // Store the URL in browsing_history
    db.run('INSERT INTO browsing_history (url, timestamp, category) VALUES (?, ?, ?)', [url, timestamp, category], function(err) {
      if (err) {
        console.error('Error inserting into browsing_history:', err.message);
        res.status(500).json({ error: err.message });
      } else {
        console.log(`Row inserted with ID: ${this.lastID}`);
        res.status(200).send();
      }
    });
  }
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


// Start the server
app.listen(5000, () => {
  console.log('Backend server running on port 5000');
});
