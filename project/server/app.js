const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const TICK_RATE = 60;
const WORLD_SIZE = 4000;

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

// Игровое состояние
const gameState = {
  players: new Map(),
  coins: new Map(),
  enemies: new Map(),
  bullets: new Map(),
  droppedCoins: new Map(),
  lastCoinId: 0,
  lastEnemyId: 0,
  lastBulletId: 0,
  lastDroppedCoinId: 0
};

// Генерация монет
function generateCoins() {
  for (let i = 0; i < 80; i++) {
    const id = ++gameState.lastCoinId;
    gameState.coins.set(id, {
      id,
      x: Math.random() * (WORLD_SIZE - 200) + 100,
      y: Math.random() * (WORLD_SIZE - 200) + 100,
      value: 1
    });
  }
}

// Генерация врагов
function generateEnemies() {
  const types = ['basic', 'fast', 'shooter', 'tank', 'runner'];
  for (let i = 0; i < 15; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const id = ++gameState.lastEnemyId;
    
    let stats;
    switch(type) {
      case 'fast':
        stats = {hp: 30, maxHp: 30, speed: 2.5, size: 16, damage: 8, color: '#84f'};
        break;
      case 'shooter':
        stats = {hp: 25, maxHp: 25, speed: 0.8, size: 18, damage: 15, color: '#4a4', lastShot: 0};
        break;
      case 'tank':
        stats = {hp: 80, maxHp: 80, speed: 0.6, size: 24, damage: 20, color: '#666'};
        break;
      case 'runner':
        stats = {hp: 20, maxHp: 20, speed: 3, size: 14, damage: 5, color: '#f84'};
        break;
      default:
        stats = {hp: 40, maxHp: 40, speed: 1.2, size: 18, damage: 12, color: '#f44'};
    }

    gameState.enemies.set(id, {
      id,
      x: Math.random() * (WORLD_SIZE - 400) + 200,
      y: Math.random() * (WORLD_SIZE - 400) + 200,
      type,
      lastHit: 0,
      target: null,
      ...stats
    });
  }
}

// Утилиты
function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function findClosestPlayer(enemy) {
  let closest = null;
  let minDist = Infinity;
  
  for (let player of gameState.players.values()) {
    if (player.hp <= 0) continue;
    const dist = distance(enemy, player);
    if (dist < minDist) {
      minDist = dist;
      closest = player;
    }
  }
  return closest;
}

// Обновление игрового состояния
function updateGame() {
  // Обновление врагов
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

    // ИИ поведение
    if (enemy.type === 'shooter' && dist < 300 && Date.now() - enemy.lastShot > 1500) {
      const bulletId = ++gameState.lastBulletId;
      gameState.bullets.set(bulletId, {
        id: bulletId,
        x: enemy.x,
        y: enemy.y,
        vx: (dx / dist) * 3,
        vy: (dy / dist) * 3,
        damage: enemy.damage,
        life: 120,
        fromEnemy: true
      });
      enemy.lastShot = Date.now();
    }

    // Движение к цели
    if (dist > 0 && dist > (enemy.type === 'runner' ? 200 : 30)) {
      const moveSpeed = enemy.type === 'runner' && dist < 100 ? -enemy.speed : enemy.speed;
      enemy.x += (dx / dist) * moveSpeed;
      enemy.y += (dy / dist) * moveSpeed;
    }

    // Ограничение карты
    enemy.x = Math.max(50, Math.min(WORLD_SIZE - 50, enemy.x));
    enemy.y = Math.max(50, Math.min(WORLD_SIZE - 50, enemy.y));

    // Атака игроков
    if (dist < 35 && Date.now() - enemy.lastHit > 1000) {
      target.hp -= enemy.damage;
      enemy.lastHit = Date.now();
      
      if (target.hp <= 0) {
        handlePlayerDeath(target);
      }
    }
  }

  // Обновление пуль
  for (let [bulletId, bullet] of gameState.bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.life--;

    // Проверка столкновений с игроками
    for (let player of gameState.players.values()) {
      if (player.hp > 0 && distance(bullet, player) < 20) {
        player.hp -= bullet.damage;
        gameState.bullets.delete(bulletId);
        
        if (player.hp <= 0) {
          handlePlayerDeath(player);
        }
        break;
      }
    }

    // Удаление устаревших пуль
    if (bullet.life <= 0 || bullet.x < 0 || bullet.x > WORLD_SIZE || bullet.y < 0 || bullet.y > WORLD_SIZE) {
      gameState.bullets.delete(bulletId);
    }
  }

  // Респавн врагов
  if (gameState.enemies.size < 10) {
    setTimeout(() => {
      const types = ['basic', 'fast', 'shooter', 'tank', 'runner'];
      const type = types[Math.floor(Math.random() * types.length)];
      const id = ++gameState.lastEnemyId;
      
      let stats;
      switch(type) {
        case 'fast':
          stats = {hp: 30, maxHp: 30, speed: 2.5, size: 16, damage: 8, color: '#84f'};
          break;
        case 'shooter':
          stats = {hp: 25, maxHp: 25, speed: 0.8, size: 18, damage: 15, color: '#4a4', lastShot: 0};
          break;
        case 'tank':
          stats = {hp: 80, maxHp: 80, speed: 0.6, size: 24, damage: 20, color: '#666'};
          break;
        case 'runner':
          stats = {hp: 20, maxHp: 20, speed: 3, size: 14, damage: 5, color: '#f84'};
          break;
        default:
          stats = {hp: 40, maxHp: 40, speed: 1.2, size: 18, damage: 12, color: '#f44'};
      }

      gameState.enemies.set(id, {
        id,
        x: Math.random() * (WORLD_SIZE - 400) + 200,
        y: Math.random() * (WORLD_SIZE - 400) + 200,
        type,
        lastHit: 0,
        target: null,
        ...stats
      });
    }, 5000);
  }
}

function handlePlayerDeath(player) {
  // Половина монет выпадает
  const coinsToeDrop = Math.floor(player.coins / 2);
  for (let i = 0; i < coinsToeDrop; i++) {
    const dropId = ++gameState.lastDroppedCoinId;
    gameState.droppedCoins.set(dropId, {
      id: dropId,
      x: player.x + (Math.random() - 0.5) * 100,
      y: player.y + (Math.random() - 0.5) * 100,
      value: 1,
      timeout: Date.now() + 30000 // 30 секунд
    });
  }

  // Сохранение рекорда
  if (player.coins > 0) {
    const stmt = db.prepare('INSERT INTO scores (player_name, score) VALUES (?, ?)');
    stmt.run(player.name, player.coins);
    stmt.finalize();
  }

  // Респавн игрока
  player.hp = 100;
  player.coins = 0;
  player.x = WORLD_SIZE / 2 + (Math.random() - 0.5) * 200;
  player.y = WORLD_SIZE / 2 + (Math.random() - 0.5) * 200;
}

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', (data) => {
    const player = {
      id: socket.id,
      name: data.name || `Player${Math.floor(Math.random() * 1000)}`,
      x: WORLD_SIZE / 2 + (Math.random() - 0.5) * 200,
      y: WORLD_SIZE / 2 + (Math.random() - 0.5) * 200,
      hp: 100,
      maxHp: 100,
      coins: 0,
      size: 20,
      lastAttack: 0,
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

    // Атака врагов
    for (let [enemyId, enemy] of gameState.enemies) {
      if (distance(player, enemy) < 60) {
        enemy.hp -= 40;
        if (enemy.hp <= 0) {
          gameState.enemies.delete(enemyId);
          player.coins += 2; // Бонус за убийство врага
        }
      }
    }

    // PvP атака
    for (let [playerId, otherPlayer] of gameState.players) {
      if (playerId !== socket.id && otherPlayer.hp > 0 && distance(player, otherPlayer) < 60) {
        otherPlayer.hp -= 30;
        if (otherPlayer.hp <= 0) {
          player.coins += Math.floor(otherPlayer.coins / 4); // Бонус за убийство игрока
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

// Основной игровой цикл
setInterval(() => {
  updateGame();
  
  // Проверка подбора монет
  for (let [playerId, player] of gameState.players) {
    if (player.hp <= 0) continue;
    
    // Обычные монеты
    for (let [coinId, coin] of gameState.coins) {
      if (distance(player, coin) < 25) {
        player.coins++;
        gameState.coins.delete(coinId);
      }
    }
    
    // Выпавшие монеты
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
  
  // Респавн монет
  if (gameState.coins.size < 60) {
    const id = ++gameState.lastCoinId;
    gameState.coins.set(id, {
      id,
      x: Math.random() * (WORLD_SIZE - 200) + 100,
      y: Math.random() * (WORLD_SIZE - 200) + 100,
      value: 1
    });
  }
  
  // Отправка состояния клиентам
  const state = {
    players: Array.from(gameState.players.values()),
    coins: Array.from(gameState.coins.values()),
    enemies: Array.from(gameState.enemies.values()),
    bullets: Array.from(gameState.bullets.values()),
    droppedCoins: Array.from(gameState.droppedCoins.values())
  };
  
  io.emit('gameState', state);
}, Math.floor(1000 / TICK_RATE));

// REST API endpoints
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

// Инициализация
generateCoins();
generateEnemies();

server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});