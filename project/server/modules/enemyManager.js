const GAME_CONFIG = require('../gameConfig');

class EnemyManager {
  constructor() {
    this.enemies = new Map();
    this.nextId = 1;
    this.generateEnemies();
  }

  generateEnemies() {
    for (let i = 0; i < GAME_CONFIG.ENEMIES.MAX_COUNT; i++) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    const template = GAME_CONFIG.ENEMIES.TYPES[Math.floor(Math.random() * GAME_CONFIG.ENEMIES.TYPES.length)];
    const id = this.nextId++;
    this.enemies.set(id, {
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

  findClosestPlayer(enemy, players) {
    let closest = null, minDist = Infinity;
    for (let player of players.values()) {
      if (player.hp <= 0) continue;
      const dist = this.distance(enemy, player);
      if (dist < minDist) { 
        minDist = dist; 
        closest = player; 
      }
    }
    return closest;
  }

  getMeleeRange(enemy) {
    return (enemy.size + GAME_CONFIG.PLAYER.SIZE) / 2 + 5;
  }

  update(players, bulletManager, coinManager) {
    const now = Date.now();
    
    for (let [enemyId, enemy] of this.enemies) {
      if (enemy.hp <= 0) {
        coinManager.dropCoinFromEnemy(enemy.x, enemy.y, enemy.type);
        this.enemies.delete(enemyId);
        continue;
      }

      const target = this.findClosestPlayer(enemy, players);
      if (!target) continue;

      const dist = this.distance(enemy, target);
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const meleeRange = this.getMeleeRange(enemy);

      if (enemy.type === 'shooter' && dist < enemy.shootRange && now - enemy.lastShot > enemy.shootCooldown) {
        bulletManager.createBullet({
          x: enemy.x, 
          y: enemy.y,
          vx: (dx / dist) * GAME_CONFIG.BULLETS.ENEMY_SPEED, 
          vy: (dy / dist) * GAME_CONFIG.BULLETS.ENEMY_SPEED,
          damage: enemy.damage, 
          fromEnemy: true,
          ownerId: enemyId
        });
        enemy.lastShot = now;
      }

      if (dist > 0) {
        let shouldMove = true;
        let moveSpeed = enemy.speed;
        
        if (enemy.type === 'runner' && dist < enemy.fleeDistance) {
          moveSpeed = -enemy.speed;
        } else if (dist <= meleeRange) {
          shouldMove = false;
        }
        
        if (shouldMove) {
          enemy.x += (dx / dist) * moveSpeed;
          enemy.y += (dy / dist) * moveSpeed;
        }
      }

      enemy.x = Math.max(50, Math.min(GAME_CONFIG.WORLD_SIZE - 50, enemy.x));
      enemy.y = Math.max(50, Math.min(GAME_CONFIG.WORLD_SIZE - 50, enemy.y));

      if (dist < meleeRange && now - enemy.lastHit > GAME_CONFIG.ENEMIES.ATTACK_COOLDOWN) {
        target.hp -= enemy.damage;
        enemy.lastHit = now;
        if (target.hp <= 0) {
          return { killedPlayer: target, killerName: `${enemy.type} enemy` };
        }
      }
    }

    if (this.enemies.size < GAME_CONFIG.ENEMIES.MIN_COUNT) {
      this.spawnEnemy();
    }
    
    return null;
  }

  takeDamage(enemyId, damage) {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.hp -= damage;
      return enemy.hp <= 0;
    }
    return false;
  }

  removeEnemy(enemyId) {
    this.enemies.delete(enemyId);
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  getState() {
    return Array.from(this.enemies.values());
  }
}

module.exports = EnemyManager;