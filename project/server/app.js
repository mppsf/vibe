const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

const db = new sqlite3.Database('game.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.post('/api/scores', (req, res) => {
  const { playerName, score } = req.body;
  
  if (!playerName || typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  if (playerName.length > 50) {
    return res.status(400).json({ error: 'Name too long' });
  }

  const stmt = db.prepare('INSERT INTO scores (player_name, score) VALUES (?, ?)');
  stmt.run(playerName.trim(), score, function(err) {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json({ id: this.lastID, message: 'Score saved' });
    }
  });
  stmt.finalize();
});

app.get('/api/scores', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  
  db.all(
    'SELECT player_name, score, created_at FROM scores ORDER BY score DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(rows);
      }
    }
  );
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});