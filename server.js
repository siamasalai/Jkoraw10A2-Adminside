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

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin.html'));
});

// GET all fundraisers
app.get('/api/fundraisers', (req, res) => {
  pool.query('SELECT * FROM FUNDRAISER', (err, rows) => {
    if (err) {
      console.error('Error executing query (FUNDRAISER):', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// POST a new fundraiser
app.post('/api/fundraisers', (req, res) => {
  const { title, description, goal_amount, start_date, end_date, category_id } = req.body;
  const query = 'INSERT INTO FUNDRAISER (title, description, goal_amount, start_date, end_date, category_id) VALUES (?, ?, ?, ?, ?, ?)';
  pool.query(query, [title, description, goal_amount, start_date, end_date, category_id], (err, result) => {
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
  const { title, description, goal_amount, start_date, end_date, category_id } = req.body;
  const query = 'UPDATE FUNDRAISER SET title = ?, description = ?, goal_amount = ?, start_date = ?, end_date = ?, category_id = ? WHERE id = ?';
  pool.query(query, [title, description, goal_amount, start_date, end_date, category_id, id], (err, result) => {
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
  pool.query('DELETE FROM FUNDRAISER WHERE id = ?', [id], (err, result) => {
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
  pool.query('SELECT * FROM DONATION WHERE fundraiser_id = ?', [id], (err, rows) => {
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

//http://localhost:9000/Admin
//GET http://localhost:9000/api/fundraisers
//GET http://localhost:9000/api/categories
//GET http://localhost:9000/api/donations