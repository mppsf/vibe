const GAME_CONFIG = require('../gameConfig');

class PlayerManager {
  constructor() {
    this.players = new Map();
  }

  addPlayer(socketId, data) {
    const player = {
      id: socketId,
      name: data.name || 'Anonymous',
      x: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100,
      y: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100,
      hp: GAME_CONFIG.PLAYER.MAX_HP,
      maxHp: GAME_CONFIG.PLAYER.MAX_HP,
      coins: 0,
      lastMeleeAttack: 0,
      lastRangedAttack: 0
    };
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  movePlayer(socketId, data) {
    const player = this.players.get(socketId);
    if (!player || player.hp <= 0) return;

    const newX = Math.max(GAME_CONFIG.PLAYER.SIZE, 
      Math.min(GAME_CONFIG.WORLD_SIZE - GAME_CONFIG.PLAYER.SIZE, 
        player.x + data.dx * GAME_CONFIG.PLAYER.SPEED));
    const newY = Math.max(GAME_CONFIG.PLAYER.SIZE, 
      Math.min(GAME_CONFIG.WORLD_SIZE - GAME_CONFIG.PLAYER.SIZE, 
        player.y + data.dy * GAME_CONFIG.PLAYER.SPEED));

    player.x = newX;
    player.y = newY;
  }

  meleeAttack(socketId, enemyManager) {
    const player = this.players.get(socketId);
    if (!player || player.hp <= 0) return null;

    const now = Date.now();
    if (now - player.lastMeleeAttack < GAME_CONFIG.ATTACKS.MELEE.COOLDOWN) return null;

    player.lastMeleeAttack = now;
    const results = { killedEnemies: [], killedPlayers: [] };

    for (let [enemyId, enemy] of enemyManager.enemies) {
      if (this.distance(player, enemy) < GAME_CONFIG.ATTACKS.MELEE.RANGE) {
        const killed = enemyManager.takeDamage(enemyId, GAME_CONFIG.ATTACKS.MELEE.DAMAGE);
        if (killed) {
          results.killedEnemies.push(enemyId);
          player.coins++;
        }
      }
    }

    for (let [playerId, otherPlayer] of this.players) {
      if (playerId === socketId || otherPlayer.hp <= 0) continue;
      if (this.distance(player, otherPlayer) < GAME_CONFIG.ATTACKS.MELEE.RANGE) {
        otherPlayer.hp -= GAME_CONFIG.ATTACKS.MELEE.DAMAGE;
        if (otherPlayer.hp <= 0) {
          results.killedPlayers.push({ 
            player: otherPlayer, 
            killer: player.name 
          });
          player.coins += Math.floor(otherPlayer.coins / 4);
        }
      }
    }

    return results;
  }

  rangedAttack(socketId, data, bulletManager) {
    const player = this.players.get(socketId);
    if (!player || player.hp <= 0) return;

    const now = Date.now();
    if (now - player.lastRangedAttack < GAME_CONFIG.ATTACKS.RANGED.COOLDOWN) return;

    player.lastRangedAttack = now;
    bulletManager.createBullet({
      x: player.x,
      y: player.y,
      vx: data.vx * GAME_CONFIG.ATTACKS.RANGED.BULLET_SPEED,
      vy: data.vy * GAME_CONFIG.ATTACKS.RANGED.BULLET_SPEED,
      damage: GAME_CONFIG.ATTACKS.RANGED.DAMAGE,
      fromEnemy: false,
      ownerId: socketId
    });
  }

  handlePlayerDeath(player, coinManager) {
    player.hp = 0;
    coinManager.dropCoinsFromPlayer(player);
    setTimeout(() => {
      if (this.players.has(player.id)) {
        player.hp = GAME_CONFIG.PLAYER.MAX_HP;
        player.x = Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100;
        player.y = Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100;
        player.coins = Math.floor(player.coins * 0.5);
      }
    }, 3000);
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  getState() {
    return Array.from(this.players.values());
  }
}

module.exports = PlayerManager;