class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.minimap = document.getElementById('minimap');
    this.minimapCtx = this.minimap.getContext('2d');
    this.nameModal = document.getElementById('nameModal');
    this.playerNameInput = document.getElementById('playerNameInput');
    this.joinBtn = document.getElementById('joinBtn');
    
    this.WORLD_SIZE = 3000;
    this.TILE_SIZE = 40;
    this.MAP_BORDER = 50;
    
    this.state = {
      camera: {x: 0, y: 0},
      myPlayer: null,
      players: new Map(),
      coins: [],
      particles: [],
      keys: {},
      joined: false
    };
    
    this.init();
  }

  init() {
    this.resize();
    this.setupEvents();
    this.showNameModal();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('beforeunload', () => gameAPI.leaveGame());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupEvents() {
    document.addEventListener('keydown', e => {
      this.state.keys[e.key.toLowerCase()] = true;
      if (['w','a','s','d',' '].includes(e.key.toLowerCase())) e.preventDefault();
    });
    document.addEventListener('keyup', e => this.state.keys[e.key.toLowerCase()] = false);
    
    this.joinBtn.onclick = () => this.joinGame();
    this.playerNameInput.onkeypress = e => e.key === 'Enter' && this.joinGame();
  }

  showNameModal() {
    this.nameModal.style.display = 'flex';
    this.playerNameInput.focus();
  }

  async joinGame() {
    const name = this.playerNameInput.value.trim();
    if (!name) return;
    
    try {
      const data = await gameAPI.joinGame(name);
      this.state.myPlayer = data.player;
      this.state.joined = true;
      this.nameModal.style.display = 'none';
      document.getElementById('playerName').textContent = name;
      this.gameLoop();
    } catch (error) {
      alert('Ошибка подключения');
    }
  }

  updateCamera() {
    if (!this.state.myPlayer) return;
    const player = this.state.myPlayer;
    this.state.camera.x = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.width, 
      player.x - this.canvas.width / 2));
    this.state.camera.y = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.height, 
      player.y - this.canvas.height / 2));
  }

  updateInput() {
    if (!this.state.myPlayer) return;
    
    let dx = 0, dy = 0;
    if (this.state.keys.w) dy = -1;
    if (this.state.keys.s) dy = 1;
    if (this.state.keys.a) dx = -1;
    if (this.state.keys.d) dx = 1;
    
    if (dx && dy) { dx *= 0.7; dy *= 0.7; }
    
    const player = this.state.myPlayer;
    const speed = 3;
    const newX = Math.max(this.MAP_BORDER, Math.min(this.WORLD_SIZE - this.MAP_BORDER, 
      player.x + dx * speed));
    const newY = Math.max(this.MAP_BORDER, Math.min(this.WORLD_SIZE - this.MAP_BORDER, 
      player.y + dy * speed));
    
    if (newX !== player.x || newY !== player.y) {
      player.x = newX;
      player.y = newY;
      gameAPI.updatePlayer({x: player.x, y: player.y, hp: player.hp, coins: player.coins});
    }
    
    if (this.state.keys[' '] && Date.now() - (player.lastAttack || 0) > 300) {
      player.lastAttack = Date.now();
      gameAPI.attack(player.x, player.y);
    }
  }

  async updateGameState() {
    if (!this.state.joined) return;
    
    try {
      const data = await gameAPI.getGameState();
      this.state.players = new Map(data.players.map(p => [p.id, p]));
      this.state.coins = data.coins;
      
      const myPlayer = this.state.players.get(gameAPI.playerId);
      if (myPlayer) {
        this.state.myPlayer = myPlayer;
        document.getElementById('coins').textContent = myPlayer.coins;
        document.getElementById('hp').textContent = Math.max(0, myPlayer.hp);
        
        if (myPlayer.hp <= 0) {
          await gameAPI.saveScore(myPlayer.coins);
          location.reload();
        }
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  }

  draw() {
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawGrid();
    this.drawBorders();
    this.drawCoins();
    this.drawPlayers();
    this.drawMinimap();
  }

  drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    const startX = Math.floor(this.state.camera.x / this.TILE_SIZE) * this.TILE_SIZE;
    const startY = Math.floor(this.state.camera.y / this.TILE_SIZE) * this.TILE_SIZE;
    
    for (let x = startX; x < this.state.camera.x + this.canvas.width + this.TILE_SIZE; x += this.TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - this.state.camera.x, 0);
      this.ctx.lineTo(x - this.state.camera.x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = startY; y < this.state.camera.y + this.canvas.height + this.TILE_SIZE; y += this.TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y - this.state.camera.y);
      this.ctx.lineTo(this.canvas.width, y - this.state.camera.y);
      this.ctx.stroke();
    }
  }

  drawBorders() {
    this.ctx.strokeStyle = '#f44';
    this.ctx.lineWidth = 5;
    const border = this.MAP_BORDER;
    
    // Left border
    if (this.state.camera.x < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(border - this.state.camera.x, 0);
      this.ctx.lineTo(border - this.state.camera.x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Right border
    if (this.state.camera.x + this.canvas.width > this.WORLD_SIZE - border - 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.WORLD_SIZE - border - this.state.camera.x, 0);
      this.ctx.lineTo(this.WORLD_SIZE - border - this.state.camera.x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Top border
    if (this.state.camera.y < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, border - this.state.camera.y);
      this.ctx.lineTo(this.canvas.width, border - this.state.camera.y);
      this.ctx.stroke();
    }
    
    // Bottom border
    if (this.state.camera.y + this.canvas.height > this.WORLD_SIZE - border - 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.WORLD_SIZE - border - this.state.camera.y);
      this.ctx.lineTo(this.canvas.width, this.WORLD_SIZE - border - this.state.camera.y);
      this.ctx.stroke();
    }
  }

  drawCoins() {
    this.state.coins.forEach(coin => {
      const x = coin.x - this.state.camera.x;
      const y = coin.y - this.state.camera.y;
      if (x > -20 && x < this.canvas.width + 20 && y > -20 && y < this.canvas.height + 20) {
        this.ctx.fillStyle = '#fd3';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ff6';
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawPlayers() {
    this.state.players.forEach(player => {
      const x = player.x - this.state.camera.x;
      const y = player.y - this.state.camera.y;
      if (x > -30 && x < this.canvas.width + 30 && y > -30 && y < this.canvas.height + 30) {
        const isMe = player.id === gameAPI.playerId;
        const size = 20;
        
        // Player body
        this.ctx.fillStyle = isMe ? '#2af' : '#f42';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        
        // Inner color
        this.ctx.fillStyle = isMe ? '#4df' : '#a22';
        this.ctx.fillRect(x - size/2 + 2, y - size/2 + 2, size - 4, size - 4);
        
        // Eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x - 6, y - 6, 3, 3);
        this.ctx.fillRect(x + 3, y - 6, 3, 3);
        
        // Health bar
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - 12, y - 18, 24, 4);
        this.ctx.fillStyle = '#4f4';
        this.ctx.fillRect(x - 12, y - 18, player.hp / 100 * 24, 4);
        
        // Name
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
    
    // Map border
    this.minimapCtx.strokeStyle = '#555';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(0, 0, 150, 150);
    
    const scale = 150 / this.WORLD_SIZE;
    
    // Players
    this.state.players.forEach(player => {
      const x = player.x * scale;
      const y = player.y * scale;
      const isMe = player.id === gameAPI.playerId;
      
      this.minimapCtx.fillStyle = isMe ? '#2af' : '#f42';
      this.minimapCtx.fillRect(x - 2, y - 2, 4, 4);
    });
    
    // Camera view
    if (this.state.myPlayer) {
      this.minimapCtx.strokeStyle = '#fff';
      this.minimapCtx.lineWidth = 1;
      const camX = this.state.camera.x * scale;
      const camY = this.state.camera.y * scale;
      const camW = this.canvas.width * scale;
      const camH = this.canvas.height * scale;
      this.minimapCtx.strokeRect(camX, camY, camW, camH);
    }
  }

  gameLoop() {
    if (!this.state.joined) return;
    
    this.updateInput();
    this.updateCamera();
    this.draw();
    
    if (Date.now() % 5 === 0) this.updateGameState();
    
    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new Game();