const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const GAME_CONFIG = require('./gameConfig');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = process.env.PORT || 3000;

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
  for (let i = 0; i < GAME_CONFIG.COINS.MAX_COUNT; i++) {
    const id = gameState.nextId.coin++;
    gameState.coins.set(id, {
      id, 
      x: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100,
      y: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100, 
      value: 1
    });
  }
}

function generateEnemies() {
  for (let i = 0; i < GAME_CONFIG.ENEMIES.MAX_COUNT; i++) {
    const template = GAME_CONFIG.ENEMIES.TYPES[Math.floor(Math.random() * GAME_CONFIG.ENEMIES.TYPES.length)];
    const id = gameState.nextId.enemy++;
    gameState.enemies.set(id, {
      ...template, 
      id, 
      maxHp: template.hp,
      x: Math.random() * (GAME_CONFIG.WORLD_SIZE - 400) + 200,
      y: Math.random() * (GAME_CONFIG.WORLD_SIZE - 400) + 200,
      lastHit: 0, 
      lastShot: 0,
      target: null
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
    if (dist < minDist) { 
      minDist = dist; 
      closest = player; 
    }
  }
  return closest;
}

function updateGame() {
  const now = Date.now();
  
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

    // Стрельба для shooter типа
    if (enemy.type === 'shooter' && dist < enemy.shootRange && now - enemy.lastShot > enemy.shootCooldown) {
      const bulletId = gameState.nextId.bullet++;
      gameState.bullets.set(bulletId, {
        id: bulletId, 
        x: enemy.x, 
        y: enemy.y,
        vx: (dx / dist) * GAME_CONFIG.BULLETS.ENEMY_SPEED, 
        vy: (dy / dist) * GAME_CONFIG.BULLETS.ENEMY_SPEED,
        damage: enemy.damage, 
        life: GAME_CONFIG.ATTACKS.RANGED.BULLET_LIFE, 
        fromEnemy: true,
        ownerId: enemyId
      });
      enemy.lastShot = now;
    }

    // Движение врагов
    if (dist > 0) {
      let shouldMove = true;
      let moveSpeed = enemy.speed;
      
      if (enemy.type === 'runner' && dist < enemy.fleeDistance) {
        moveSpeed = -enemy.speed; // Убегает
      } else if (dist <= GAME_CONFIG.ENEMIES.MELEE_RANGE) {
        shouldMove = false; // Остановился для атаки
      }
      
      if (shouldMove) {
        enemy.x += (dx / dist) * moveSpeed;
        enemy.y += (dy / dist) * moveSpeed;
      }
    }

    enemy.x = Math.max(50, Math.min(GAME_CONFIG.WORLD_SIZE - 50, enemy.x));
    enemy.y = Math.max(50, Math.min(GAME_CONFIG.WORLD_SIZE - 50, enemy.y));

    // Атака врагов
    if (dist < GAME_CONFIG.ENEMIES.MELEE_RANGE && now - enemy.lastHit > GAME_CONFIG.ENEMIES.ATTACK_COOLDOWN) {
      target.hp -= enemy.damage;
      enemy.lastHit = now;
      if (target.hp <= 0) {
        handlePlayerDeath(target);
        io.to(target.id).emit('death', { killerName: `${enemy.type} enemy` });
      }
    }
  }

  // Обновление пуль
  for (let [bulletId, bullet] of gameState.bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.life--;

    let bulletHit = false;

    // Пули от врагов атакуют игроков
    if (bullet.fromEnemy) {
      for (let player of gameState.players.values()) {
        if (player.hp > 0 && distance(bullet, player) < GAME_CONFIG.BULLETS.COLLISION_RANGE) {
          player.hp -= bullet.damage;
          bulletHit = true;
          if (player.hp <= 0) {
            handlePlayerDeath(player);
            io.to(player.id).emit('death', { killerName: 'enemy shooter' });
          }
          break;
        }
      }
    } 
    // Пули от игроков атакуют врагов и других игроков
    else {
      // Атака врагов
      for (let [enemyId, enemy] of gameState.enemies) {
        if (distance(bullet, enemy) < GAME_CONFIG.BULLETS.COLLISION_RANGE) {
          enemy.hp -= bullet.damage;
          bulletHit = true;
          if (enemy.hp <= 0) {
            gameState.enemies.delete(enemyId);
            const shooter = gameState.players.get(bullet.ownerId);
            if (shooter) {
              shooter.coins += GAME_CONFIG.COINS.ENEMY_REWARD;
              io.to(bullet.ownerId).emit('enemyKilled', { enemyId });
            }
          }
          break;
        }
      }
      
      // Атака других игроков
      if (!bulletHit) {
        for (let player of gameState.players.values()) {
          if (player.id !== bullet.ownerId && player.hp > 0 && distance(bullet, player) < GAME_CONFIG.BULLETS.COLLISION_RANGE) {
            player.hp -= bullet.damage;
            bulletHit = true;
            if (player.hp <= 0) {
              const shooter = gameState.players.get(bullet.ownerId);
              if (shooter) {
                shooter.coins += Math.floor(player.coins / 4);
                io.to(bullet.ownerId).emit('playerKilled', { 
                  victimId: player.id, 
                  killerId: bullet.ownerId 
                });
              }
              handlePlayerDeath(player);
              io.to(player.id).emit('death', { 
                killerName: shooter ? shooter.name : 'Unknown' 
              });
            }
            break;
          }
        }
      }
    }

    if (bulletHit || bullet.life <= 0 || bullet.x < 0 || bullet.x > GAME_CONFIG.WORLD_SIZE || bullet.y < 0 || bullet.y > GAME_CONFIG.WORLD_SIZE) {
      gameState.bullets.delete(bulletId);
    }
  }

  // Респавн врагов
  if (gameState.enemies.size < GAME_CONFIG.ENEMIES.MIN_COUNT) {
    const template = GAME_CONFIG.ENEMIES.TYPES[Math.floor(Math.random() * GAME_CONFIG.ENEMIES.TYPES.length)];
    const id = gameState.nextId.enemy++;
    gameState.enemies.set(id, {
      ...template, 
      id, 
      maxHp: template.hp,
      x: Math.random() * (GAME_CONFIG.WORLD_SIZE - 400) + 200,
      y: Math.random() * (GAME_CONFIG.WORLD_SIZE - 400) + 200,
      lastHit: 0, 
      lastShot: 0,
      target: null
    });
  }
}

function handlePlayerDeath(player) {
  const coinsToDrop = Math.floor(player.coins * GAME_CONFIG.PLAYER.RESPAWN_COINS_DROP);
  for (let i = 0; i < coinsToDrop; i++) {
    const dropId = gameState.nextId.drop++;
    gameState.droppedCoins.set(dropId, {
      id: dropId,
      x: player.x + (Math.random() - 0.5) * 100,
      y: player.y + (Math.random() - 0.5) * 100,
      value: 1, 
      timeout: Date.now() + GAME_CONFIG.COINS.DROP_TIMEOUT
    });
  }

  if (player.coins > 0) {
    const stmt = db.prepare('INSERT INTO scores (player_name, score) VALUES (?, ?)');
    stmt.run(player.name, player.coins, (err) => {
      if (err) console.error('DB insert error:', err);
    });
    stmt.finalize();
  }

  player.hp = GAME_CONFIG.PLAYER.MAX_HP;
  player.coins = 0;
  player.x = GAME_CONFIG.WORLD_SIZE / 2 + (Math.random() - 0.5) * 200;
  player.y = GAME_CONFIG.WORLD_SIZE / 2 + (Math.random() - 0.5) * 200;
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', (data) => {
    const player = {
      id: socket.id,
      name: data.name || `Player${Math.floor(Math.random() * 1000)}`,
      x: GAME_CONFIG.WORLD_SIZE / 2 + (Math.random() - 0.5) * 200,
      y: GAME_CONFIG.WORLD_SIZE / 2 + (Math.random() - 0.5) * 200,
      hp: GAME_CONFIG.PLAYER.MAX_HP, 
      maxHp: GAME_CONFIG.PLAYER.MAX_HP, 
      coins: 0, 
      size: GAME_CONFIG.PLAYER.SIZE, 
      lastMeleeAttack: 0,
      lastRangedAttack: 0,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    gameState.players.set(socket.id, player);
    socket.emit('joined', { playerId: socket.id, worldSize: GAME_CONFIG.WORLD_SIZE });
  });

  socket.on('move', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || player.hp <= 0) return;

    let { dx, dy } = data;
    if (dx && dy) { 
      dx *= 0.7; 
      dy *= 0.7; 
    }
    
    player.x += dx * GAME_CONFIG.PLAYER.SPEED;
    player.y += dy * GAME_CONFIG.PLAYER.SPEED;
    player.x = Math.max(20, Math.min(GAME_CONFIG.WORLD_SIZE - 20, player.x));
    player.y = Math.max(20, Math.min(GAME_CONFIG.WORLD_SIZE - 20, player.y));
  });

  socket.on('meleeAttack', () => {
    const player = gameState.players.get(socket.id);
    const now = Date.now();
    if (!player || player.hp <= 0 || now - player.lastMeleeAttack < GAME_CONFIG.ATTACKS.MELEE.COOLDOWN) return;

    player.lastMeleeAttack = now;

    // Атака врагов
    for (let [enemyId, enemy] of gameState.enemies) {
      if (distance(player, enemy) < GAME_CONFIG.ATTACKS.MELEE.RANGE) {
        enemy.hp -= GAME_CONFIG.ATTACKS.MELEE.DAMAGE;
        if (enemy.hp <= 0) {
          gameState.enemies.delete(enemyId);
          player.coins += GAME_CONFIG.COINS.ENEMY_REWARD;
          socket.emit('enemyKilled', { enemyId });
        }
      }
    }

    // Атака других игроков
    for (let [playerId, otherPlayer] of gameState.players) {
      if (playerId !== socket.id && otherPlayer.hp > 0 && distance(player, otherPlayer) < GAME_CONFIG.ATTACKS.MELEE.RANGE) {
        otherPlayer.hp -= GAME_CONFIG.ATTACKS.MELEE.DAMAGE;
        if (otherPlayer.hp <= 0) {
          player.coins += Math.floor(otherPlayer.coins / 4);
          handlePlayerDeath(otherPlayer);
          io.to(playerId).emit('death', { killerName: player.name });
          socket.emit('playerKilled', { victimId: playerId, killerId: socket.id });
        }
      }
    }
  });

  socket.on('rangedAttack', () => {
    const player = gameState.players.get(socket.id);
    const now = Date.now();
    if (!player || player.hp <= 0 || now - player.lastRangedAttack < GAME_CONFIG.ATTACKS.RANGED.COOLDOWN) return;

    player.lastRangedAttack = now;

    // Находим ближайшую цель
    let target = null;
    let minDist = Infinity;
    
    // Ищем ближайшего врага
    for (let enemy of gameState.enemies.values()) {
      const dist = distance(player, enemy);
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }
    
    // Если врагов нет поблизости, ищем игроков
    if (!target || minDist > 200) {
      for (let otherPlayer of gameState.players.values()) {
        if (otherPlayer.id !== socket.id && otherPlayer.hp > 0) {
          const dist = distance(player, otherPlayer);
          if (dist < minDist) {
            minDist = dist;
            target = otherPlayer;
          }
        }
      }
    }

    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const bulletId = gameState.nextId.bullet++;
      gameState.bullets.set(bulletId, {
        id: bulletId,
        x: player.x,
        y: player.y,
        vx: (dx / dist) * GAME_CONFIG.ATTACKS.RANGED.BULLET_SPEED,
        vy: (dy / dist) * GAME_CONFIG.ATTACKS.RANGED.BULLET_SPEED,
        damage: GAME_CONFIG.ATTACKS.RANGED.DAMAGE,
        life: GAME_CONFIG.ATTACKS.RANGED.BULLET_LIFE,
        fromEnemy: false,
        ownerId: socket.id
      });
    }
  });

  // Обратная совместимость
  socket.on('attack', () => {
    socket.emit('meleeAttack');
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameState.players.delete(socket.id);
  });
});

setInterval(() => {
  updateGame();
  
  // Подбор монет и дропа
  for (let [playerId, player] of gameState.players) {
    if (player.hp <= 0) continue;
    
    for (let [coinId, coin] of gameState.coins) {
      if (distance(player, coin) < GAME_CONFIG.COINS.PICKUP_RANGE) {
        player.coins++;
        gameState.coins.delete(coinId);
      }
    }
    
    for (let [dropId, drop] of gameState.droppedCoins) {
      if (Date.now() > drop.timeout) {
        gameState.droppedCoins.delete(dropId);
        continue;
      }
      if (distance(player, drop) < GAME_CONFIG.COINS.PICKUP_RANGE) {
        player.coins++;
        gameState.droppedCoins.delete(dropId);
      }
    }
  }
  
  // Респавн монет
  if (gameState.coins.size < GAME_CONFIG.COINS.MIN_COUNT) {
    const id = gameState.nextId.coin++;
    gameState.coins.set(id, {
      id, 
      x: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100,
      y: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100, 
      value: 1
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
}, Math.floor(1000 / GAME_CONFIG.TICK_RATE));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    players: gameState.players.size,
    enemies: gameState.enemies.size,
    bullets: gameState.bullets.size
  });
});

generateCoins();
generateEnemies();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});