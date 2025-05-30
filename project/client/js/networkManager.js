class NetworkManager {
  constructor(game) {
    this.game = game;
  }

  setup() {
    this.game.socket.on('joined', data => {
      console.log('Подключен к игре:', data);
      this.game.playerId = data.playerId;
      
      // Обновляем размер мира если пришел от сервера
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

    // Обработка ошибок
    this.game.socket.on('error', (error) => {
      console.error('Ошибка игры:', error);
      alert('Ошибка игры: ' + error);
    });

    this.game.socket.on('disconnect', () => {
      console.log('Отключен от сервера');
      alert('Соединение с сервером потеряно. Обновите страницу.');
    });

    // Обновление статистики каждую секунду
    setInterval(() => {
      this.game.modules.ui.updateStats();
    }, 1000);
  }

  handleGameState(data) {
    // Обработка массива игроков
    if (data.players && Array.isArray(data.players)) {
      this.game.state.players = new Map(data.players.map(p => [p.id, p]));
    }
    
    // Обработка других игровых объектов
    this.game.state.coins = data.coins || [];
    this.game.state.enemies = data.enemies || [];
    this.game.state.bullets = data.bullets || [];
    this.game.state.droppedCoins = data.droppedCoins || [];
    
    // Обновление данных текущего игрока
    const myPlayer = this.game.state.players.get(this.game.playerId);
    if (myPlayer) {
      this.game.state.myPlayer = myPlayer;
      this.game.modules.ui.updatePlayerStats();
    }
    
    // Обновление списка игроков
    this.game.modules.ui.updatePlayerList();
  }
}