const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/game.db');
    this.db = new sqlite3.Database(dbPath);
  }

  saveScore(playerName, score) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO scores (player_name, score) VALUES (?, ?)',
        [playerName, score],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getTopScores(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT player_name, score, created_at FROM scores ORDER BY score DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getPlayerStats(playerName) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT score, created_at FROM scores WHERE player_name = ? ORDER BY score DESC',
        [playerName],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;