class NetworkManager {
  constructor(game) {
    this.game = game;
  }

  setup() {
    this.game.socket.on('joined', data => {
      this.game.playerId = data.playerId;
      const modal = document.getElementById('nameModal');
      if (modal) {
        modal.style.display = 'none';
      }
      this.game.gameLoop();
    });

    this.game.socket.on('gameState', data => {
      this.handleGameState(data);
    });

    this.game.socket.on('death', data => {
      this.game.onDeath();
      this.game.modules.ui.showDeathMessage(data.killerName);
    });

    this.game.socket.on('enemyKilled', data => {
      this.game.addKill('mob');
    });

    this.game.socket.on('playerKilled', data => {
      if (data.killerId === this.game.playerId) {
        this.game.addKill('player');
      }
    });

    // Обновление статистики каждую секунду
    setInterval(() => {
      this.game.modules.ui.updateStats();
    }, 1000);
  }

  handleGameState(data) {
    if (data.players) {
      this.game.state.players = new Map(data.players.map(p => [p.id, p]));
    }
    this.game.state.coins = data.coins || [];
    this.game.state.enemies = data.enemies || [];
    this.game.state.bullets = data.bullets || [];
    this.game.state.droppedCoins = data.droppedCoins || [];
    
    const myPlayer = this.game.state.players.get(this.game.playerId);
    if (myPlayer) {
      this.game.state.myPlayer = myPlayer;
      this.game.modules.ui.updatePlayerStats();
    }
    
    this.game.modules.ui.updatePlayerList();
  }
}