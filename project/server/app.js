const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = process.env.PORT || 3000;
const WORLD_SIZE = 4000;
const TICK_RATE = 60;

app.use(express.static(path.join(__dirname, '../client')));

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'game.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const gameState = {
  players: new Map(),
  coins: new Map(),
  enemies: new Map(),
  bullets: new Map(),
  droppedCoins: new Map(),
  nextId: { coin: 1, enemy: 1, bullet: 1, drop: 1 }
};

function generateCoins() {
  for (let i = 0; i < 80; i++) {
    const id = gameState.nextId.coin++;
    gameState.coins.set(id, {
      id, x: Math.random() * (WORLD_SIZE - 200) + 100,
      y: Math.random() * (WORLD_SIZE - 200) + 100, value: 1
    });
  }
}

function generateEnemies() {
  const types = [
    { type: 'basic', hp: 40, speed: 1.2, size: 18, damage: 12, color: '#f44' },
    { type: 'fast', hp: 30, speed: 2.5, size: 16, damage: 8, color: '#84f' },
    { type: 'shooter', hp: 25, speed: 0.8, size: 18, damage: 15, color: '#4a4', lastShot: 0 },
    { type: 'tank', hp: 80, speed: 0.6, size: 24, damage: 20, color: '#666' },
    { type: 'runner', hp: 20, speed: 3, size: 14, damage: 5, color: '#f84' }
  ];
  
  for (let i = 0; i < 15; i++) {
    const template = types[Math.floor(Math.random() * types.length)];
    const id = gameState.nextId.enemy++;
    gameState.enemies.set(id, {
      ...template, id, maxHp: template.hp,
      x: Math.random() * (WORLD_SIZE - 400) + 200,
      y: Math.random() * (WORLD_SIZE - 400) + 200,
      lastHit: 0, target: null
    });
  }
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function findClosestPlayer(enemy) {
  let closest = null, minDist = Infinity;
  for (let player of gameState.players.values()) {
    if (player.hp <= 0) continue;
    const dist = distance(enemy, player);
    if (dist < minDist) { minDist = dist; closest = player; }
  }
  return closest;
}

function updateGame() {
  const now = Date.now();
  
  for (let [enemyId, enemy] of gameState.enemies) {
    if (enemy.hp <= 0) {
      gameState.enemies.delete(enemyId);
      continue;
    }

    const target = findClosestPlayer(enemy);
    if (!target) continue;

    const dist = distance(enemy, target);
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;

    if (enemy.type === 'shooter' && dist < 300 && now - enemy.lastShot > 1500) {
      const bulletId = gameState.nextId.bullet++;
      gameState.bullets.set(bulletId, {
        id: bulletId, x: enemy.x, y: enemy.y,
        vx: (dx / dist) * 3, vy: (dy / dist) * 3,
        damage: enemy.damage, life: 120, fromEnemy: true
      });
      enemy.lastShot = now;
    }

    if (dist > 0 && dist > (enemy.type === 'runner' ? 200 : 30)) {
      const moveSpeed = enemy.type === 'runner' && dist < 100 ? -enemy.speed : enemy.speed;
      enemy.x += (dx / dist) * moveSpeed;
      enemy.y += (dy / dist) * moveSpeed;
    }

    enemy.x = Math.max(50, Math.min(WORLD_SIZE - 50, enemy.x));
    enemy.y = Math.max(50, Math.min(WORLD_SIZE - 50, enemy.y));

    if (dist < 35 && now - enemy.lastHit > 1000) {
      target.hp -= enemy.damage;
      enemy.lastHit = now;
      if (target.hp <= 0) handlePlayerDeath(target);
    }
  }

  for (let [bulletId, bullet] of gameState.bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.life--;

    for (let player of gameState.players.values()) {
      if (player.hp > 0 && distance(bullet, player) < 20) {
        player.hp -= bullet.damage;
        gameState.bullets.delete(bulletId);
        if (player.hp <= 0) handlePlayerDeath(player);
        break;
      }
    }

    if (bullet.life <= 0 || bullet.x < 0 || bullet.x > WORLD_SIZE || bullet.y < 0 || bullet.y > WORLD_SIZE) {
      gameState.bullets.delete(bulletId);
    }
  }

  if (gameState.enemies.size < 10) {
    const types = [
      { type: 'basic', hp: 40, speed: 1.2, size: 18, damage: 12, color: '#f44' },
      { type: 'fast', hp: 30, speed: 2.5, size: 16, damage: 8, color: '#84f' },
      { type: 'shooter', hp: 25, speed: 0.8, size: 18, damage: 15, color: '#4a4', lastShot: 0 },
      { type: 'tank', hp: 80, speed: 0.6, size: 24, damage: 20, color: '#666' },
      { type: 'runner', hp: 20, speed: 3, size: 14, damage: 5, color: '#f84' }
    ];
    const template = types[Math.floor(Math.random() * types.length)];
    const id = gameState.nextId.enemy++;
    gameState.enemies.set(id, {
      ...template, id, maxHp: template.hp,
      x: Math.random() * (WORLD_SIZE - 400) + 200,
      y: Math.random() * (WORLD_SIZE - 400) + 200,
      lastHit: 0, target: null
    });
  }
}

function handlePlayerDeath(player) {
  const coinsToDrop = Math.floor(player.coins / 2);
  for (let i = 0; i < coinsToDrop; i++) {
    const dropId = gameState.nextId.drop++;
    gameState.droppedCoins.set(dropId, {
      id: dropId,
      x: player.x + (Math.random() - 0.5) * 100,
      y: player.y + (Math.random() - 0.5) * 100,
      value: 1, timeout: Date.now() + 30000
    });
  }

  if (player.coins > 0) {
    const stmt = db.prepare('INSERT INTO scores (player_name, score) VALUES (?, ?)');
    stmt.run(player.name, player.coins, (err) => {
      if (err) console.error('DB insert error:', err);
    });
    stmt.finalize();
  }

  player.hp = 100;
  player.coins = 0;
  player.x = WORLD_SIZE / 2 + (Math.random() - 0.5) * 200;
  player.y = WORLD_SIZE / 2 + (Math.random() - 0.5) * 200;
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', (data) => {
    const player = {
      id: socket.id,
      name: data.name || `Player${Math.floor(Math.random() * 1000)}`,
      x: WORLD_SIZE / 2 + (Math.random() - 0.5) * 200,
      y: WORLD_SIZE / 2 + (Math.random() - 0.5) * 200,
      hp: 100, maxHp: 100, coins: 0, size: 20, lastAttack: 0,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    gameState.players.set(socket.id, player);
    socket.emit('joined', { playerId: socket.id, worldSize: WORLD_SIZE });
  });

  socket.on('move', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || player.hp <= 0) return;

    const speed = 3;
    let { dx, dy } = data;
    if (dx && dy) { dx *= 0.7; dy *= 0.7; }
    
    player.x += dx * speed;
    player.y += dy * speed;
    player.x = Math.max(20, Math.min(WORLD_SIZE - 20, player.x));
    player.y = Math.max(20, Math.min(WORLD_SIZE - 20, player.y));
  });

  socket.on('attack', () => {
    const player = gameState.players.get(socket.id);
    if (!player || player.hp <= 0 || Date.now() - player.lastAttack < 300) return;

    player.lastAttack = Date.now();

    for (let [enemyId, enemy] of gameState.enemies) {
      if (distance(player, enemy) < 60) {
        enemy.hp -= 40;
        if (enemy.hp <= 0) {
          gameState.enemies.delete(enemyId);
          player.coins += 2;
        }
      }
    }

    for (let [playerId, otherPlayer] of gameState.players) {
      if (playerId !== socket.id && otherPlayer.hp > 0 && distance(player, otherPlayer) < 60) {
        otherPlayer.hp -= 30;
        if (otherPlayer.hp <= 0) {
          player.coins += Math.floor(otherPlayer.coins / 4);
          handlePlayerDeath(otherPlayer);
          io.to(playerId).emit('death', { killerName: player.name });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameState.players.delete(socket.id);
  });
});

setInterval(() => {
  updateGame();
  
  for (let [playerId, player] of gameState.players) {
    if (player.hp <= 0) continue;
    
    for (let [coinId, coin] of gameState.coins) {
      if (distance(player, coin) < 25) {
        player.coins++;
        gameState.coins.delete(coinId);
      }
    }
    
    for (let [dropId, drop] of gameState.droppedCoins) {
      if (Date.now() > drop.timeout) {
        gameState.droppedCoins.delete(dropId);
        continue;
      }
      if (distance(player, drop) < 25) {
        player.coins++;
        gameState.droppedCoins.delete(dropId);
      }
    }
  }
  
  if (gameState.coins.size < 60) {
    const id = gameState.nextId.coin++;
    gameState.coins.set(id, {
      id, x: Math.random() * (WORLD_SIZE - 200) + 100,
      y: Math.random() * (WORLD_SIZE - 200) + 100, value: 1
    });
  }
  
  const state = {
    players: Array.from(gameState.players.values()),
    coins: Array.from(gameState.coins.values()),
    enemies: Array.from(gameState.enemies.values()),
    bullets: Array.from(gameState.bullets.values()),
    droppedCoins: Array.from(gameState.droppedCoins.values())
  };
  
  io.emit('gameState', state);
}, Math.floor(1000 / TICK_RATE));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', players: gameState.players.size });
});

generateCoins();
generateEnemies();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});