class Game {
  constructor() {
    // Проверка подключения Socket.IO
    if (typeof io === 'undefined') {
      console.error('Socket.IO не найден');
      alert('Socket.IO библиотека не загружена. Проверьте подключение к интернету.');
      return;
    }

    try {
      this.socket = io();
      this.socket.on('connect', () => console.log('Socket подключен'));
      this.socket.on('connect_error', (error) => {
        console.error('Ошибка подключения:', error);
        alert('Сервер недоступен. Запустите серверную часть.');
      });
    } catch (error) {
      console.error('Ошибка инициализации Socket.IO:', error);
      alert('Ошибка подключения к серверу');
      return;
    }

    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.minimap = document.getElementById('minimap');
    this.minimapCtx = this.minimap.getContext('2d');
    
    this.playerId = null;
    this.WORLD_SIZE = 4000;
    this.MAP_SCALE = 160 / this.WORLD_SIZE;
    
    this.state = {
      camera: {x: 0, y: 0},
      myPlayer: null,
      players: new Map(),
      coins: [],
      enemies: [],
      bullets: [],
      droppedCoins: [],
      keys: {}
    };
    
    this.init();
  }

  init() {
    this.resize();
    this.setupEvents();
    this.setupSocket();
    this.showNameModal();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupEvents() {
    const keys = ['w','a','s','d',' '];
    document.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();
      this.state.keys[key] = true;
      if (keys.includes(key)) e.preventDefault();
    });
    document.addEventListener('keyup', e => this.state.keys[e.key.toLowerCase()] = false);
    
    // Исправляем обработчики событий для кнопки и поля ввода
    const joinBtn = document.getElementById('joinBtn');
    const nameInput = document.getElementById('playerNameInput');
    
    if (joinBtn) {
      joinBtn.addEventListener('click', () => this.joinGame());
    }
    
    if (nameInput) {
      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.joinGame();
        }
      });
    }
  }

  setupSocket() {
    this.socket.on('joined', data => {
      this.playerId = data.playerId;
      const modal = document.getElementById('nameModal');
      if (modal) {
        modal.style.display = 'none';
      }
      this.gameLoop();
    });

    this.socket.on('gameState', data => {
      if (data.players) {
        this.state.players = new Map(data.players.map(p => [p.id, p]));
      }
      this.state.coins = data.coins || [];
      this.state.enemies = data.enemies || [];
      this.state.bullets = data.bullets || [];
      this.state.droppedCoins = data.droppedCoins || [];
      
      const myPlayer = this.state.players.get(this.playerId);
      if (myPlayer) {
        this.state.myPlayer = myPlayer;
        const coinsEl = document.getElementById('coins');
        const hpEl = document.getElementById('hp');
        
        if (coinsEl) {
          coinsEl.textContent = myPlayer.coins || 0;
        }
        if (hpEl) {
          hpEl.textContent = Math.max(0, myPlayer.hp || 0);
        }
      }
      this.updatePlayerList();
    });

    this.socket.on('death', data => {
      alert(`Вас убил ${data.killerName}!`);
    });
  }

  showNameModal() {
    const modal = document.getElementById('nameModal');
    const input = document.getElementById('playerNameInput');
    
    if (modal) {
      modal.style.display = 'flex';
    }
    if (input) {
      input.focus();
    }
  }

  joinGame() {
    const nameInput = document.getElementById('playerNameInput');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) {
      alert('Введите имя!');
      nameInput.focus();
      return;
    }
    
    this.socket.emit('join', { name });
    
    const playerNameEl = document.getElementById('playerName');
    if (playerNameEl) {
      playerNameEl.textContent = `Игрок: ${name}`;
    }
  }

  updatePlayerList() {
    const playerList = document.getElementById('playerList');
    if (!playerList) return;
    
    const players = Array.from(this.state.players.values());
    
    if (players.length <= 1) {
      playerList.style.display = 'none';
      return;
    }
    
    playerList.style.display = 'block';
    playerList.innerHTML = players
      .sort((a, b) => (b.coins || 0) - (a.coins || 0))
      .map(p => `
        <div class="player-item">
          <span class="player-name">${p.name || 'Игрок'}</span>
          <span class="player-stats">${p.coins || 0}💰 ${Math.max(0, p.hp || 0)}❤️</span>
        </div>
      `).join('');
  }

  updateInput() {
    if (!this.state.myPlayer) return;
    
    let dx = 0, dy = 0;
    if (this.state.keys.w) dy = -1;
    if (this.state.keys.s) dy = 1;
    if (this.state.keys.a) dx = -1;
    if (this.state.keys.d) dx = 1;
    
    if (dx || dy) {
      this.socket.emit('move', { dx, dy });
    }
    
    if (this.state.keys[' ']) {
      this.socket.emit('attack');
    }
  }

  updateCamera() {
    if (!this.state.myPlayer) return;
    const p = this.state.myPlayer;
    this.state.camera.x = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.width, p.x - this.canvas.width / 2));
    this.state.camera.y = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.height, p.y - this.canvas.height / 2));
  }

  draw() {
    // Основной фон с улучшенным градиентом
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height)
    );
    gradient.addColorStop(0, '#2d2d2d');
    gradient.addColorStop(1, '#1a1a1a');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawGrid();
    this.drawBorders();
    this.drawEntities();
    this.drawMinimap();
  }

  drawGrid() {
    this.ctx.strokeStyle = '#404040';
    this.ctx.lineWidth = 1;
    const size = 50;
    const startX = Math.floor(this.state.camera.x / size) * size;
    const startY = Math.floor(this.state.camera.y / size) * size;
    
    this.ctx.globalAlpha = 0.3;
    
    for (let x = startX; x < this.state.camera.x + this.canvas.width + size; x += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - this.state.camera.x, 0);
      this.ctx.lineTo(x - this.state.camera.x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = startY; y < this.state.camera.y + this.canvas.height + size; y += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y - this.state.camera.y);
      this.ctx.lineTo(this.canvas.width, y - this.state.camera.y);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }

  drawBorders() {
    this.ctx.strokeStyle = '#ff4444';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#ff4444';
    this.ctx.shadowBlur = 10;
    
    const border = 50;
    const cam = this.state.camera;
    
    // Границы мира с эффектом свечения
    if (cam.x < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(border - cam.x, 0);
      this.ctx.lineTo(border - cam.x, this.canvas.height);
      this.ctx.stroke();
    }
    if (cam.x + this.canvas.width > this.WORLD_SIZE - border - 10) {
      const x = this.WORLD_SIZE - border - cam.x;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    if (cam.y < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, border - cam.y);
      this.ctx.lineTo(this.canvas.width, border - cam.y);
      this.ctx.stroke();
    }
    if (cam.y + this.canvas.height > this.WORLD_SIZE - border - 10) {
      const y = this.WORLD_SIZE - border - cam.y;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
  }

  drawEntities() {
    const cam = this.state.camera;
    
    // Монеты с улучшенным эффектом
    [...this.state.coins, ...this.state.droppedCoins].forEach(coin => {
      const x = coin.x - cam.x;
      const y = coin.y - cam.y;
      if (x > -20 && x < this.canvas.width + 20 && y > -20 && y < this.canvas.height + 20) {
        // Свечение для монет
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Внутренний круг
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffed4e';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    // Враги с улучшенной визуализацией
    this.state.enemies.forEach(enemy => {
      const x = enemy.x - cam.x;
      const y = enemy.y - cam.y;
      if (x > -30 && x < this.canvas.width + 30 && y > -30 && y < this.canvas.height + 30) {
        // Тень врага
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - enemy.size/2 + 2, y - enemy.size/2 + 2, enemy.size, enemy.size);
        
        // Основное тело врага
        this.ctx.fillStyle = enemy.color || '#ff6b6b';
        this.ctx.fillRect(x - enemy.size/2, y - enemy.size/2, enemy.size, enemy.size);
        
        // HP бар с улучшенным дизайном
        const barWidth = 26;
        const barHeight = 5;
        
        // Фон HP бара
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - barWidth/2, y - 20, barWidth, barHeight);
        
        // HP
        const hpPercent = (enemy.hp || 0) / (enemy.maxHp || 100);
        this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(x - barWidth/2, y - 20, hpPercent * barWidth, barHeight);
        
        // Рамка HP бара
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - barWidth/2, y - 20, barWidth, barHeight);
      }
    });
    
    // Пули с трейлером
    this.state.bullets.forEach(bullet => {
      const x = bullet.x - cam.x;
      const y = bullet.y - cam.y;
      
      // Трейлер пули
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.fillRect(x - 4, y - 4, 8, 8);
      
      // Основная пуля
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(x - 2, y - 2, 4, 4);
    });
    
    // Игроки с улучшенной визуализацией
    this.state.players.forEach(player => {
      const x = player.x - cam.x;
      const y = player.y - cam.y;
      if (x > -30 && x < this.canvas.width + 30 && y > -30 && y < this.canvas.height + 30) {
        const isMe = player.id === this.playerId;
        const size = 20;
        
        // Тень игрока
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - size/2 + 2, y - size/2 + 2, size, size);
        
        // Основное тело игрока
        if (isMe) {
          // Свечение для своего игрока
          this.ctx.shadowColor = '#2196F3';
          this.ctx.shadowBlur = 10;
        }
        
        this.ctx.fillStyle = isMe ? '#2196F3' : '#ff6b6b';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        this.ctx.shadowBlur = 0;
        
        // HP бар игрока
        const barWidth = 26;
        const barHeight = 5;
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - barWidth/2, y - 20, barWidth, barHeight);
        
        const hpPercent = Math.max(0, (player.hp || 0)) / 100;
        this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(x - barWidth/2, y - 20, hpPercent * barWidth, barHeight);
        
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - barWidth/2, y - 20, barWidth, barHeight);
        
        // Имя игрока с улучшенным шрифтом
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(player.name || 'Игрок', x, y + 30);
        this.ctx.fillText(player.name || 'Игрок', x, y + 30);
      }
    });
  }

  drawMinimap() {
    // Очистка миникарты
    this.minimapCtx.fillStyle = '#1a1a1a';
    this.minimapCtx.fillRect(0, 0, 160, 160);
    
    // Рамка миникарты
    this.minimapCtx.strokeStyle = '#555';
    this.minimapCtx.lineWidth = 2;
    this.minimapCtx.strokeRect(0, 0, 160, 160);
    
    // Границы мира на миникарте
    this.minimapCtx.strokeStyle = '#ff4444';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(2, 2, 156, 156);
    
    // Игроки на миникарте
    this.state.players.forEach(player => {
      const x = player.x * this.MAP_SCALE;
      const y = player.y * this.MAP_SCALE;
      const isMe = player.id === this.playerId;
      
      this.minimapCtx.fillStyle = isMe ? '#2196F3' : '#ff6b6b';
      this.minimapCtx.fillRect(x - 2, y - 2, 4, 4);
      
      if (isMe) {
        // Дополнительное кольцо для своего игрока
        this.minimapCtx.strokeStyle = '#2196F3';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(x, y, 6, 0, Math.PI * 2);
        this.minimapCtx.stroke();
      }
    });
    
    // Область просмотра на миникарте
    if (this.state.myPlayer) {
      this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.minimapCtx.lineWidth = 1;
      const camX = this.state.camera.x * this.MAP_SCALE;
      const camY = this.state.camera.y * this.MAP_SCALE;
      const camW = this.canvas.width * this.MAP_SCALE;
      const camH = this.canvas.height * this.MAP_SCALE;
      this.minimapCtx.strokeRect(camX, camY, camW, camH);
    }
  }

  gameLoop() {
    this.updateInput();
    this.updateCamera();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Инициализация игры
const game = new Game();