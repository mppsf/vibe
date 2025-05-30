const GAME_CONFIG = require('../gameConfig');

class BulletManager {
  constructor() {
    this.bullets = new Map();
    this.nextId = 1;
  }

  createBullet(bulletData) {
    const id = this.nextId++;
    this.bullets.set(id, {
      id,
      x: bulletData.x,
      y: bulletData.y,
      vx: bulletData.vx,
      vy: bulletData.vy,
      damage: bulletData.damage,
      fromEnemy: bulletData.fromEnemy || false,
      ownerId: bulletData.ownerId,
      life: bulletData.life || GAME_CONFIG.ATTACKS.RANGED.BULLET_LIFE,
      createdAt: Date.now()
    });
  }

  update(players, enemyManager) {
    const results = { killedPlayers: [], killedEnemies: [] };
    
    for (let [bulletId, bullet] of this.bullets) {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life--;

      if (bullet.life <= 0 || 
          bullet.x < 0 || bullet.x > GAME_CONFIG.WORLD_SIZE ||
          bullet.y < 0 || bullet.y > GAME_CONFIG.WORLD_SIZE) {
        this.bullets.delete(bulletId);
        continue;
      }

      if (bullet.fromEnemy) {
        for (let [playerId, player] of players) {
          if (player.hp <= 0) continue;
          if (this.distance(bullet, player) < GAME_CONFIG.BULLETS.COLLISION_RANGE) {
            player.hp -= bullet.damage;
            this.bullets.delete(bulletId);
            if (player.hp <= 0) {
              results.killedPlayers.push({ 
                player, 
                killerName: 'enemy bullet',
                shooterId: null 
              });
            }
            break;
          }
        }
      } else {
        for (let [enemyId, enemy] of enemyManager.enemies) {
          if (this.distance(bullet, enemy) < GAME_CONFIG.BULLETS.COLLISION_RANGE) {
            const killed = enemyManager.takeDamage(enemyId, bullet.damage);
            this.bullets.delete(bulletId);
            if (killed) {
              results.killedEnemies.push({ 
                enemyId, 
                shooterId: bullet.ownerId 
              });
            }
            break;
          }
        }

        for (let [playerId, player] of players) {
          if (playerId === bullet.ownerId || player.hp <= 0) continue;
          if (this.distance(bullet, player) < GAME_CONFIG.BULLETS.COLLISION_RANGE) {
            player.hp -= bullet.damage;
            this.bullets.delete(bulletId);
            if (player.hp <= 0) {
              const shooter = players.get(bullet.ownerId);
              results.killedPlayers.push({ 
                player, 
                killerName: shooter?.name || 'unknown player',
                shooterId: bullet.ownerId 
              });
            }
            break;
          }
        }
      }
    }

    return results;
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  getState() {
    return Array.from(this.bullets.values());
  }
}

module.exports = BulletManager;