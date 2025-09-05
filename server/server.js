const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 5000;

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
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// MySQL connection
let db;

async function initializeDb() {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'hari1999'
  });

  await db.execute('CREATE DATABASE IF NOT EXISTS screen_recorder');
  console.log('✅ Database created or already exists');

  await db.changeUser({ database: 'screen_recorder' });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      filepath TEXT NOT NULL,
      filesize INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await db.execute('SHOW DATABASES');
  console.log('📂 Available databases:', rows);
}

initializeDb().catch(console.error);

// Routes
app.post('/api/recordings', upload.single('recording'),async (req, res) => {
  console.log(req.file)
  if (!req.file) {
    console.error('No file received');
    return res.status(400).send('No file uploaded');
  }

  const { originalname, filename, size } = req.file;
  const url = `/uploads/${filename}`; 
   console.log(`Received file: ${originalname} (${size} bytes)`,url);
  try {
  await db.execute(
    `INSERT INTO recordings (filename, url, size) VALUES (?, ?, ?)`,
    [originalname, url, size]
  );
  console.log(`Saved recording: ${filename} (${size} bytes)`);
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
    console.error('Error fetching recordings:', err);
    res.status(500).json({ message: 'Db error' });
  }
});


app.get('/api/recordings/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT filepath FROM recordings WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) return res.status(404).send('Not found');

    res.sendFile(path.resolve(rows[0].filepath));
  } catch (err) {
    console.error('Error serving file:', err.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at port number ${PORT}`);
});

