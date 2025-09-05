const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql2/promise');
require('dotenv').config();
const { db, initializeDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// Multer config
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

//check 

app.get('/', (req, res) => {
  res.send('Server is running');
});

// MySQL connection

initializeDb();

// Routes
app.post('/api/recordings', upload.single('recording'), async (req, res) => {
  if (!req.file) {
    console.error('No file received');
    return res.status(400).send('No file uploaded');
  }

  const { originalname, filename, size } = req.file;
  const url = `/uploads/${filename}`;
  console.log(`Received file: ${originalname} (${size} bytes)`);

  try {
    await db.execute(
      `INSERT INTO recordings (filename, url, size) VALUES (?, ?, ?)`,
      [originalname, url, size]
    );
    console.log(`✅ Saved recording: ${filename}`);
    res.status(200).json({ message: 'Upload successful', filename });
  } catch (err) {
    console.error('DB error:', err.message);
    res.status(500).send('DB error: ' + err.message);
  }
});

app.get('/api/recordings', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM recordings ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching recordings:', err.message);
    res.status(500).json({ message: 'DB error' });
  }
});

app.get('/api/recordings/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT url FROM recordings WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) return res.status(404).send('Not found');

    const filePath = path.join(__dirname, rows[0].url);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error serving file:', err.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});