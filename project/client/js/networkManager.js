class NetworkManager {
  constructor(game) {
    this.game = game;
  }

  setup() {
    this.game.socket.on('joined', data => {
      console.log('Подключен к игре:', data);
      this.game.playerId = data.playerId;
      
      if (data.worldSize) {
        this.game.WORLD_SIZE = data.worldSize;
      }
      
      const modal = document.getElementById('nameModal');
      if (modal) {
        modal.style.display = 'none';
      }
      this.game.startGameLoop();
    });

    this.game.socket.on('gameState', data => {
      this.handleGameState(data);
    });

    this.game.socket.on('death', data => {
      console.log('Смерть игрока:', data);
      this.game.onDeath();
      this.game.modules.ui.showDeathMessage(data.killerName || 'Неизвестный игрок');
    });

    this.game.socket.on('enemyKilled', data => {
      console.log('Враг убит:', data);
      this.game.addKill('mob');
    });

    this.game.socket.on('playerKilled', data => {
      console.log('Игрок убит:', data);
      if (data.killerId === this.game.playerId) {
        this.game.addKill('player');
      }
    });

    this.game.socket.on('error', (error) => {
      console.error('Ошибка игры:', error);
      alert('Ошибка игры: ' + error);
    });

    this.game.socket.on('disconnect', () => {
      console.log('Отключен от сервера');
      alert('Соединение с сервером потеряно. Обновите страницу.');
    });

    setInterval(() => {
      this.game.modules.ui.updateStats();
    }, 1000);
  }

  handleGameState(data) {
    if (data.players && Array.isArray(data.players)) {
      this.game.state.players = new Map(data.players.map(p => [p.id, p]));
      
      // Обновляем позицию нашего игрока из сервера для точной синхронизации
      const serverMyPlayer = this.game.state.players.get(this.game.playerId);
      if (serverMyPlayer && this.game.state.myPlayer) {
        // Плавная интерполяция для уменьшения рывков
        const lerpFactor = 0.8;
        this.game.state.myPlayer.x = this.game.state.myPlayer.x * (1 - lerpFactor) + serverMyPlayer.x * lerpFactor;
        this.game.state.myPlayer.y = this.game.state.myPlayer.y * (1 - lerpFactor) + serverMyPlayer.y * lerpFactor;
        this.game.state.myPlayer.hp = serverMyPlayer.hp;
        this.game.state.myPlayer.maxHp = serverMyPlayer.maxHp;
        this.game.state.myPlayer.coins = serverMyPlayer.coins;
        this.game.state.myPlayer.name = serverMyPlayer.name;
      } else if (serverMyPlayer) {
        this.game.state.myPlayer = serverMyPlayer;
      }
    }
    
    this.game.state.coins = data.coins || [];
    this.game.state.enemies = data.enemies || [];
    this.game.state.bullets = data.bullets || [];
    this.game.state.droppedCoins = data.droppedCoins || [];
    
    this.game.modules.ui.updatePlayerStats();
    this.game.modules.ui.updatePlayerList();
  }
}