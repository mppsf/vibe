const PlayerManager = require('./playerManager');
const EnemyManager = require('./enemyManager');
const BulletManager = require('./bulletManager');
const CoinManager = require('./coinManager');

class GameLogic {
  constructor(io) {
    this.io = io;
    this.playerManager = new PlayerManager();
    this.enemyManager = new EnemyManager();
    this.bulletManager = new BulletManager();
    this.coinManager = new CoinManager();
  }

  update() {
    this.coinManager.update();
    
    const enemyResult = this.enemyManager.update(
      this.playerManager.players, 
      this.bulletManager, 
      this.coinManager
    );
    
    if (enemyResult?.killedPlayer) {
      this.playerManager.handlePlayerDeath(enemyResult.killedPlayer, this.coinManager);
      this.io.to(enemyResult.killedPlayer.id).emit('death', { killerName: enemyResult.killerName });
    }

    const bulletResults = this.bulletManager.update(this.playerManager.players, this.enemyManager);
    
    bulletResults.killedPlayers.forEach(({ player, killerName, shooterId }) => {
      if (shooterId) {
        const shooter = this.playerManager.players.get(shooterId);
        if (shooter) shooter.coins += Math.floor(player.coins / 4);
        this.io.to(shooterId).emit('playerKilled', { victimId: player.id, killerId: shooterId });
      }
      this.playerManager.handlePlayerDeath(player, this.coinManager);
      this.io.to(player.id).emit('death', { killerName });
    });

    bulletResults.killedEnemies.forEach(({ enemyId, shooterId }) => {
      const shooter = this.playerManager.players.get(shooterId);
      if (shooter) {
        this.io.to(shooterId).emit('enemyKilled', { enemyId });
      }
    });

    for (let [playerId, player] of this.playerManager.players) {
      if (player.hp > 0) {
        this.coinManager.checkPickup(player);
      }
    }
  }

  getGameState() {
    return {
      players: this.playerManager.getState(),
      enemies: this.enemyManager.getState(),
      bullets: this.bulletManager.getState(),
      ...this.coinManager.getState()
    };
  }

  getHealthStatus() {
    return {
      players: this.playerManager.players.size,
      enemies: this.enemyManager.enemies.size,
      bullets: this.bulletManager.bullets.size
    };
  }
}

module.exports = GameLogic;