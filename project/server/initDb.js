const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'game.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, err => {
    if (err) {
      console.error('Failed to initialize DB:', err);
      process.exit(1);
    } else {
      console.log('Database initialized successfully at', dbPath);
    }
  });
});

db.close(err => {
  if (err) {
    console.error('Error closing database:', err);
    process.exit(1);
  }
  process.exit(0);
});