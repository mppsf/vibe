class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.minimap = document.getElementById('minimap');
    this.minimapCtx = this.minimap.getContext('2d');
    
    this.socket = io();
    this.playerId = null;
    this.WORLD_SIZE = 4000;
    this.MAP_SCALE = 150 / this.WORLD_SIZE;
    
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
    
    document.getElementById('joinBtn').onclick = () => this.joinGame();
    document.getElementById('playerNameInput').onkeypress = e => e.key === 'Enter' && this.joinGame();
  }

  setupSocket() {
    this.socket.on('joined', data => {
      this.playerId = data.playerId;
      document.getElementById('nameModal').style.display = 'none';
      this.gameLoop();
    });

    this.socket.on('gameState', data => {
      this.state.players = new Map(data.players.map(p => [p.id, p]));
      this.state.coins = data.coins;
      this.state.enemies = data.enemies;
      this.state.bullets = data.bullets;
      this.state.droppedCoins = data.droppedCoins;
      
      const myPlayer = this.state.players.get(this.playerId);
      if (myPlayer) {
        this.state.myPlayer = myPlayer;
        document.getElementById('coins').textContent = myPlayer.coins;
        document.getElementById('hp').textContent = Math.max(0, myPlayer.hp);
      }
    });

    this.socket.on('death', data => {
      alert(`Вас убил ${data.killerName}!`);
    });
  }

  showNameModal() {
    document.getElementById('nameModal').style.display = 'flex';
    document.getElementById('playerNameInput').focus();
  }

  joinGame() {
    const name = document.getElementById('playerNameInput').value.trim();
    if (!name) return;
    
    this.socket.emit('join', { name });
    document.getElementById('playerName').textContent = name;
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
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawGrid();
    this.drawBorders();
    this.drawEntities();
    this.drawMinimap();
  }

  drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    const size = 40;
    const startX = Math.floor(this.state.camera.x / size) * size;
    const startY = Math.floor(this.state.camera.y / size) * size;
    
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
  }

  drawBorders() {
    this.ctx.strokeStyle = '#f44';
    this.ctx.lineWidth = 5;
    const border = 50;
    const cam = this.state.camera;
    
    if (cam.x < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(border - cam.x, 0);
      this.ctx.lineTo(border - cam.x, this.canvas.height);
      this.ctx.stroke();
    }
    if (cam.x + this.canvas.width > this.WORLD_SIZE - border - 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.WORLD_SIZE - border - cam.x, 0);
      this.ctx.lineTo(this.WORLD_SIZE - border - cam.x, this.canvas.height);
      this.ctx.stroke();
    }
    if (cam.y < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, border - cam.y);
      this.ctx.lineTo(this.canvas.width, border - cam.y);
      this.ctx.stroke();
    }
    if (cam.y + this.canvas.height > this.WORLD_SIZE - border - 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.WORLD_SIZE - border - cam.y);
      this.ctx.lineTo(this.canvas.width, this.WORLD_SIZE - border - cam.y);
      this.ctx.stroke();
    }
  }

  drawEntities() {
    const cam = this.state.camera;
    
    // Монеты
    [...this.state.coins, ...this.state.droppedCoins].forEach(coin => {
      const x = coin.x - cam.x;
      const y = coin.y - cam.y;
      if (x > -20 && x < this.canvas.width + 20 && y > -20 && y < this.canvas.height + 20) {
        this.ctx.fillStyle = '#fd3';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    
    // Враги
    this.state.enemies.forEach(enemy => {
      const x = enemy.x - cam.x;
      const y = enemy.y - cam.y;
      if (x > -30 && x < this.canvas.width + 30 && y > -30 && y < this.canvas.height + 30) {
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(x - enemy.size/2, y - enemy.size/2, enemy.size, enemy.size);
        
        // HP бар
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - 12, y - 18, 24, 4);
        this.ctx.fillStyle = '#4f4';
        this.ctx.fillRect(x - 12, y - 18, enemy.hp / enemy.maxHp * 24, 4);
      }
    });
    
    // Пули
    this.state.bullets.forEach(bullet => {
      const x = bullet.x - cam.x;
      const y = bullet.y - cam.y;
      this.ctx.fillStyle = '#ff0';
      this.ctx.fillRect(x - 2, y - 2, 4, 4);
    });
    
    // Игроки
    this.state.players.forEach(player => {
      const x = player.x - cam.x;
      const y = player.y - cam.y;
      if (x > -30 && x < this.canvas.width + 30 && y > -30 && y < this.canvas.height + 30) {
        const isMe = player.id === this.playerId;
        const size = 20;
        
        this.ctx.fillStyle = isMe ? '#2af' : '#f42';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - 12, y - 18, 24, 4);
        this.ctx.fillStyle = '#4f4';
        this.ctx.fillRect(x - 12, y - 18, player.hp / 100 * 24, 4);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, x, y + 25);
      }
    });
  }

  drawMinimap() {
    this.minimapCtx.fillStyle = '#000';
    this.minimapCtx.fillRect(0, 0, 150, 150);
    this.minimapCtx.strokeStyle = '#555';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(0, 0, 150, 150);
    
    // Игроки
    this.state.players.forEach(player => {
      const x = player.x * this.MAP_SCALE;
      const y = player.y * this.MAP_SCALE;
      const isMe = player.id === this.playerId;
      this.minimapCtx.fillStyle = isMe ? '#2af' : '#f42';
      this.minimapCtx.fillRect(x - 2, y - 2, 4, 4);
    });
    
    // Камера
    if (this.state.myPlayer) {
      this.minimapCtx.strokeStyle = '#fff';
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

const game = new Game();