const mysql = require('mysql2/promise');
require('dotenv').config();

let db;

async function initializeDb() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST ,
      user: process.env.DB_USER ,
      password: process.env.DB_PASSWORD ,
    });

    await db.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log('Database created or already exists');

    await db.changeUser({ database: process.env.DB_NAME });
    await db.execute(`
      CREATE TABLE IF NOT EXISTS recordings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        size INT NOT NULL,
        url TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Table "recordings" is ready');
  } catch (err) {
    console.error('DB initialization error:', err.message);
    process.exit(1);
  }
}
module.exports = { db, initializeDb };