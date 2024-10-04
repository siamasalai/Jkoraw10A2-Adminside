const mysql = require('mysql2');
const express = require('express');
const path = require('path');
const cors = require('cors');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Storms!2024za',
  database: 'crowdfunding_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Serve Admin.html for the /admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin.html'));
});

// GET all fundraisers
app.get('/api/fundraisers', (req, res) => {
  const query = `
    SELECT F.FUNDRAISER_ID, F.ORGANIZER, F.CAPTION, F.TARGET_FUNDING, F.CURRENT_FUNDING, 
           F.CITY, F.ACTIVE, C.NAME AS CATEGORY_NAME
    FROM FUNDRAISER F
    JOIN CATEGORY C ON F.CATEGORY_ID = C.CATEGORY_ID
  `;
  pool.query(query, (err, rows) => {
    if (err) {
      console.error('Error executing query (FUNDRAISER):', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// GET all categories (new API to fetch categories)
app.get('/api/categories', (req, res) => {
  const query = 'SELECT * FROM CATEGORY';
  pool.query(query, (err, rows) => {
    if (err) {
      console.error('Error fetching categories:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// POST a new fundraiser
app.post('/api/fundraisers', (req, res) => {
  const { organizer, caption, target_funding, current_funding, city, active, category_id } = req.body;

  // Ensure current funding doesn't exceed target funding
  if (current_funding > target_funding) {
    return res.status(400).json({ error: 'Current funding cannot exceed target funding.' });
  }

  const query = `
    INSERT INTO FUNDRAISER (ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  pool.query(query, [organizer, caption, target_funding, current_funding, city, active, category_id], (err, result) => {
    if (err) {
      console.error('Error inserting fundraiser:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, message: 'Fundraiser created successfully' });
  });
});

// PUT (update) a fundraiser
app.put('/api/fundraisers/:id', (req, res) => {
  const { id } = req.params;
  const { organizer, caption, target_funding, current_funding, city, active, category_id } = req.body;

  // Ensure current funding doesn't exceed target funding
  if (current_funding > target_funding) {
    return res.status(400).json({ error: 'Current funding cannot exceed target funding.' });
  }

  const query = `
    UPDATE FUNDRAISER 
    SET ORGANIZER = ?, CAPTION = ?, TARGET_FUNDING = ?, CURRENT_FUNDING = ?, CITY = ?, ACTIVE = ?, CATEGORY_ID = ?
    WHERE FUNDRAISER_ID = ?
  `;
  pool.query(query, [organizer, caption, target_funding, current_funding, city, active, category_id, id], (err, result) => {
    if (err) {
      console.error('Error updating fundraiser:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fundraiser not found' });
    }
    res.json({ message: 'Fundraiser updated successfully' });
  });
});

// DELETE a fundraiser
app.delete('/api/fundraisers/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM FUNDRAISER WHERE FUNDRAISER_ID = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting fundraiser:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fundraiser not found' });
    }
    res.json({ message: 'Fundraiser deleted successfully' });
  });
});

// GET donations for a specific fundraiser
app.get('/api/fundraisers/:id/donations', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM DONATION WHERE fundraiser_id = ?';
  pool.query(query, [id], (err, rows) => {
    if (err) {
      console.error('Error fetching donations:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

const port = 9000;
app.listen(port, () => {
  console.log(`Admin server listening at http://localhost:${port}`);
});
