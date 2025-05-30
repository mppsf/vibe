const GAME_CONFIG = require('./gameConfig');

class CoinManager {
  constructor() {
    this.coins = new Map();
    this.droppedCoins = new Map();
    this.nextId = { coin: 1, drop: 1 };
    this.lastCoinSpawn = 0;
  }

  spawnCoin() {
    const id = this.nextId.coin++;
    this.coins.set(id, {
      id, 
      x: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100,
      y: Math.random() * (GAME_CONFIG.WORLD_SIZE - 200) + 100, 
      value: 1
    });
  }

  dropCoinFromEnemy(x, y, enemyType) {
    const dropChance = GAME_CONFIG.ENEMIES.TYPES.find(t => t.type === enemyType)?.dropChance || 0;
    if (Math.random() < dropChance) {
      const dropId = this.nextId.drop++;
      this.droppedCoins.set(dropId, {
        id: dropId,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        value: 1, 
        timeout: Date.now() + GAME_CONFIG.COINS.DROP_TIMEOUT
      });
    }
  }

  dropCoinsFromPlayer(player) {
    const coinsToDrop = Math.floor(player.coins * GAME_CONFIG.PLAYER.RESPAWN_COINS_DROP);
    for (let i = 0; i < coinsToDrop; i++) {
      const dropId = this.nextId.drop++;
      this.droppedCoins.set(dropId, {
        id: dropId,
        x: player.x + (Math.random() - 0.5) * 100,
        y: player.y + (Math.random() - 0.5) * 100,
        value: 1, 
        timeout: Date.now() + GAME_CONFIG.COINS.DROP_TIMEOUT
      });
    }
  }

  checkPickup(player) {
    for (let [coinId, coin] of this.coins) {
      if (this.distance(player, coin) < GAME_CONFIG.COINS.PICKUP_RANGE) {
        player.coins++;
        this.coins.delete(coinId);
      }
    }
    
    for (let [dropId, drop] of this.droppedCoins) {
      if (Date.now() > drop.timeout) {
        this.droppedCoins.delete(dropId);
        continue;
      }
      if (this.distance(player, drop) < GAME_CONFIG.COINS.PICKUP_RANGE) {
        player.coins++;
        this.droppedCoins.delete(dropId);
      }
    }
  }

  update() {
    const now = Date.now();
    if (now - this.lastCoinSpawn > 6000 && this.coins.size < 10) {
      this.spawnCoin();
      this.lastCoinSpawn = now;
    }
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  getState() {
    return {
      coins: Array.from(this.coins.values()),
      droppedCoins: Array.from(this.droppedCoins.values())
    };
  }
}

module.exports = CoinManager;