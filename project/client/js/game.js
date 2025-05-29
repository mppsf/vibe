class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.coinsEl = document.getElementById('coins');
    this.hpEl = document.getElementById('hp');
    this.modal = document.getElementById('gameOverModal');
    this.finalScoreEl = document.getElementById('finalScore');
    this.playerNameInput = document.getElementById('playerName');
    this.saveScoreBtn = document.getElementById('saveScore');
    this.restartBtn = document.getElementById('restartBtn');
    this.scoresListEl = document.getElementById('scoresList');

    this.WORLD_SIZE = 6000;
    this.TILE_SIZE = 40;

    this.gameState = {
      camera: {x: 0, y: 0},
      player: {x: this.WORLD_SIZE/2, y: this.WORLD_SIZE/2, size: 20, hp: 100, maxHp: 100, speed: 3, coins: 0, attackTime: 0},
      coins: [],
      enemies: [],
      bullets: [],
      particles: [],
      keys: {},
      lastAttack: 0,
      gameOver: false,
      scoreSaved: false
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.resizeCanvas();
    this.generateCoins();
    this.generateEnemies();
    this.gameLoop();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('focus', () => this.gameState.keys = {});
    
    this.saveScoreBtn.addEventListener('click', () => this.saveScore());
    this.restartBtn.addEventListener('click', () => this.restart());
    
    this.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveScore();
    });
  }

  handleKeyDown(e) {
    if (this.gameState.gameOver && (e.key === 'r' || e.key === 'R')) {
      this.restart();
      return;
    }
    this.gameState.keys[e.key] = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
      e.preventDefault();
    }
  }

  handleKeyUp(e) {
    this.gameState.keys[e.key] = false;
  }

  resizeCanvas() {
    this.canvas.width = Math.min(window.innerWidth, 800);
    this.canvas.height = Math.min(window.innerHeight, 600);
    this.canvas.tabIndex = 1;
    this.canvas.focus();
  }

  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  generateCoins() {
    for (let i = 0; i < 150; i++) {
      this.gameState.coins.push({
        x: this.random(100, this.WORLD_SIZE - 100),
        y: this.random(100, this.WORLD_SIZE - 100),
        size: 10,
        collected: false,
        glow: this.random(0, Math.PI * 2)
      });
    }
  }

  generateEnemies() {
    for (let i = 0; i < 30; i++) {
      const type = Math.random() < 0.5 ? 'basic' : Math.random() < 0.7 ? 'fast' : 'shooter';
      this.gameState.enemies.push({
        x: this.random(300, this.WORLD_SIZE - 300),
        y: this.random(300, this.WORLD_SIZE - 300),
        size: type === 'shooter' ? 16 : 18,
        hp: type === 'shooter' ? 25 : 40,
        maxHp: type === 'shooter' ? 25 : 40,
        speed: type === 'fast' ? 2 : type === 'shooter' ? 0.8 : 1.2,
        lastHit: 0,
        lastShot: 0,
        type: type
      });
    }
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  updateCamera() {
    this.gameState.camera.x = this.gameState.player.x - this.canvas.width / 2;
    this.gameState.camera.y = this.gameState.player.y - this.canvas.height / 2;
    this.gameState.camera.x = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.width, this.gameState.camera.x));
    this.gameState.camera.y = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.height, this.gameState.camera.y));
  }

  updatePlayer() {
    if (this.gameState.gameOver) return;

    let dx = 0, dy = 0;
    if (this.gameState.keys.w || this.gameState.keys.W || this.gameState.keys.ArrowUp) dy -= 1;
    if (this.gameState.keys.s || this.gameState.keys.S || this.gameState.keys.ArrowDown) dy += 1;
    if (this.gameState.keys.a || this.gameState.keys.A || this.gameState.keys.ArrowLeft) dx -= 1;
    if (this.gameState.keys.d || this.gameState.keys.D || this.gameState.keys.ArrowRight) dx += 1;

    if (dx && dy) { dx *= 0.7; dy *= 0.7; }

    this.gameState.player.x += dx * this.gameState.player.speed;
    this.gameState.player.y += dy * this.gameState.player.speed;
    this.gameState.player.x = Math.max(10, Math.min(this.WORLD_SIZE - 10, this.gameState.player.x));
    this.gameState.player.y = Math.max(10, Math.min(this.WORLD_SIZE - 10, this.gameState.player.y));

    if (this.gameState.keys[' '] && Date.now() - this.gameState.lastAttack > 300) {
      this.attack();
      this.gameState.lastAttack = Date.now();
    }
  }

  attack() {
    this.gameState.player.attackTime = Date.now();
    this.gameState.enemies.forEach(enemy => {
      if (this.distance(this.gameState.player, enemy) < 60) {
        enemy.hp -= 40;
        enemy.lastHit = Date.now();
        for (let i = 0; i < 5; i++) {
          this.gameState.particles.push({
            x: enemy.x + this.random(-10, 10),
            y: enemy.y + this.random(-10, 10),
            vx: this.random(-3, 3),
            vy: this.random(-3, 3),
            life: 30,
            color: '#f44'
          });
        }
      }
    });
  }

  updateEnemies() {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      if (enemy.hp <= 0) {
        for (let i = 0; i < 10; i++) {
          this.gameState.particles.push({
            x: enemy.x + this.random(-15, 15),
            y: enemy.y + this.random(-15, 15),
            vx: this.random(-4, 4),
            vy: this.random(-4, 4),
            life: 40,
            color: '#f44'
          });
        }
        return false;
      }

      const dx = this.gameState.player.x - enemy.x;
      const dy = this.gameState.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (enemy.type === 'shooter') {
        if (dist < 200 && Date.now() - enemy.lastShot > 1200) {
          this.gameState.bullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: dx / dist * 2,
            vy: dy / dist * 2,
            life: 150
          });
          enemy.lastShot = Date.now();
        }
        if (dist > 100 && dist > 0) {
          enemy.x += dx / dist * enemy.speed;
          enemy.y += dy / dist * enemy.speed;
        }
      } else {
        if (dist > 0) {
          const spd = enemy.type === 'fast' ? 2 : enemy.speed;
          enemy.x += dx / dist * spd;
          enemy.y += dy / dist * spd;
        }
      }

      if (dist < 30 && Date.now() - enemy.lastHit > 800) {
        const dmg = enemy.type === 'fast' ? 8 : 12;
        this.gameState.player.hp -= dmg;
        enemy.lastHit = Date.now();
        for (let i = 0; i < 5; i++) {
          this.gameState.particles.push({
            x: this.gameState.player.x + this.random(-20, 20),
            y: this.gameState.player.y + this.random(-20, 20),
            vx: this.random(-3, 3),
            vy: this.random(-3, 3),
            life: 25,
            color: '#f88'
          });
        }
      }
      return true;
    });
  }

  updateBullets() {
    this.gameState.bullets = this.gameState.bullets.filter(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life--;

      if (this.distance(bullet, this.gameState.player) < 15) {
        this.gameState.player.hp -= 15;
        for (let i = 0; i < 6; i++) {
          this.gameState.particles.push({
            x: bullet.x + this.random(-8, 8),
            y: bullet.y + this.random(-8, 8),
            vx: this.random(-3, 3),
            vy: this.random(-3, 3),
            life: 20,
            color: '#fa0'
          });
        }
        return false;
      }

      return bullet.life > 0 && bullet.x > 0 && bullet.x < this.WORLD_SIZE && bullet.y > 0 && bullet.y < this.WORLD_SIZE;
    });
  }

  updateCoins() {
    this.gameState.coins.forEach(coin => {
      if (!coin.collected) {
        coin.glow += 0.1;
        if (this.distance(this.gameState.player, coin) < 25) {
          coin.collected = true;
          this.gameState.player.coins++;
          this.coinsEl.textContent = this.gameState.player.coins;
          for (let i = 0; i < 12; i++) {
            this.gameState.particles.push({
              x: coin.x + this.random(-8, 8),
              y: coin.y + this.random(-8, 8),
              vx: this.random(-3, 3),
              vy: this.random(-3, 3),
              life: 35,
              color: '#fd3'
            });
          }
        }
      }
    });
  }

  updateParticles() {
    this.gameState.particles = this.gameState.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.vx *= 0.95;
      p.vy *= 0.95;
      return p.life > 0;
    });
  }

  drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    const startX = Math.floor(this.gameState.camera.x / this.TILE_SIZE) * this.TILE_SIZE;
    const startY = Math.floor(this.gameState.camera.y / this.TILE_SIZE) * this.TILE_SIZE;

    for (let x = startX; x < this.gameState.camera.x + this.canvas.width + this.TILE_SIZE; x += this.TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - this.gameState.camera.x, 0);
      this.ctx.lineTo(x - this.gameState.camera.x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = startY; y < this.gameState.camera.y + this.canvas.height + this.TILE_SIZE; y += this.TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y - this.gameState.camera.y);
      this.ctx.lineTo(this.canvas.width, y - this.gameState.camera.y);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    const bigTileSize = this.TILE_SIZE * 5;
    const bigStartX = Math.floor(this.gameState.camera.x / bigTileSize) * bigTileSize;
    const bigStartY = Math.floor(this.gameState.camera.y / bigTileSize) * bigTileSize;

    for (let x = bigStartX; x < this.gameState.camera.x + this.canvas.width + bigTileSize; x += bigTileSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - this.gameState.camera.x, 0);
      this.ctx.lineTo(x - this.gameState.camera.x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = bigStartY; y < this.gameState.camera.y + this.canvas.height + bigTileSize; y += bigTileSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y - this.gameState.camera.y);
      this.ctx.lineTo(this.canvas.width, y - this.gameState.camera.y);
      this.ctx.stroke();
    }
  }

  drawPlayer() {
    const x = this.gameState.player.x - this.gameState.camera.x;
    const y = this.gameState.player.y - this.gameState.camera.y;

    const attacking = Date.now() - this.gameState.player.attackTime < 200;
    const size = attacking ? this.gameState.player.size + 4 : this.gameState.player.size;

    this.ctx.fillStyle = attacking ? '#4ff' : '#2af';
    this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
    this.ctx.fillStyle = attacking ? '#8ff' : '#4df';
    this.ctx.fillRect(x - size / 2 + 2, y - size / 2 + 2, size - 4, size - 4);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x - size / 2 + 6, y - size / 2 + 4, 3, 3);
    this.ctx.fillRect(x - size / 2 + 11, y - size / 2 + 4, 3, 3);

    if (attacking) {
      this.ctx.strokeStyle = '#8ff';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 30, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - 12, y - 18, 24, 4);
    this.ctx.fillStyle = '#4f4';
    this.ctx.fillRect(x - 12, y - 18, this.gameState.player.hp / this.gameState.player.maxHp * 24, 4);
  }

  drawCoins() {
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      const x = coin.x - this.gameState.camera.x;
      const y = coin.y - this.gameState.camera.y;
      if (x > -30 && x < this.canvas.width + 30 && y > -30 && y < this.canvas.height + 30) {
        const glow = Math.sin(coin.glow) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(255,221,51,${glow})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, coin.size + 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fd3';
        this.ctx.beginPath();
        this.ctx.arc(x, y, coin.size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fa0';
        this.ctx.beginPath();
        this.ctx.arc(x, y, coin.size - 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ff6';
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawEnemies() {
    this.gameState.enemies.forEach(enemy => {
      const x = enemy.x - this.gameState.camera.x;
      const y = enemy.y - this.gameState.camera.y;
      if (x > -40 && x < this.canvas.width + 40 && y > -40 && y < this.canvas.height + 40) {
        const flash = Date.now() - enemy.lastHit < 150;
        const isFast = enemy.type === 'fast';
        const isShooter = enemy.type === 'shooter';

        let color, innerColor;
        if (isShooter) {
          color = flash ? '#8f8' : '#4a4';
          innerColor = '#6a6';
        } else {
          color = flash ? (isFast ? '#f8f' : '#f88') : (isFast ? '#84f' : '#f44');
          innerColor = isFast ? '#62d' : '#a22';
        }

        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - enemy.size / 2, y - enemy.size / 2, enemy.size, enemy.size);

        this.ctx.fillStyle = innerColor;
        this.ctx.fillRect(x - enemy.size / 2 + 2, y - enemy.size / 2 + 2, enemy.size - 4, enemy.size - 4);

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x - enemy.size / 2 + 4, y - enemy.size / 2 + 3, 2, 2);
        this.ctx.fillRect(x - enemy.size / 2 + 8, y - enemy.size / 2 + 3, 2, 2);

        if (isShooter) {
          this.ctx.fillStyle = '#8f8';
          this.ctx.fillRect(x - 2, y + enemy.size / 2 - 2, 4, 4);
        }

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 10, y - 22, 20, 3);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - 10, y - 22, enemy.hp / enemy.maxHp * 20, 3);
      }
    });
  }

  drawBullets() {
    this.gameState.bullets.forEach(bullet => {
      const x = bullet.x - this.gameState.camera.x;
      const y = bullet.y - this.gameState.camera.y;
      if (x > -10 && x < this.canvas.width + 10 && y > -10 && y < this.canvas.height + 10) {
        this.ctx.fillStyle = '#fa0';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fc0';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawParticles() {
    this.gameState.particles.forEach(p => {
      const x = p.x - this.gameState.camera.x;
      const y = p.y - this.gameState.camera.y;
      if (x > -10 && x < this.canvas.width + 10 && y > -10 && y < this.canvas.height + 10) {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life / 30;
        this.ctx.fillRect(x - 1, y - 1, 2, 2);
        this.ctx.globalAlpha = 1;
      }
    });
  }

  async showGameOver() {
    this.finalScoreEl.textContent = this.gameState.player.coins;
    this.modal.style.display = 'block';
    this.playerNameInput.focus();
    this.gameState.scoreSaved = false;
    
    try {
      const scores = await gameAPI.getLeaderboard(10);
      this.displayLeaderboard(scores);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }

  displayLeaderboard(scores) {
    this.scoresListEl.innerHTML = '';
    scores.forEach((score, index) => {
      const li = document.createElement('li');
      const date = new Date(score.created_at).toLocaleDateString();
      li.innerHTML = `
        <span class="score-name">${index + 1}. ${score.player_name}</span>
        <span class="score-value">${score.score}</span>
        <span class="score-date">${date}</span>
      `;
      this.scoresListEl.appendChild(li);
    });
  }

  async saveScore() {
    const playerName = this.playerNameInput.value.trim();
    if (!playerName) {
      alert('Введите имя!');
      return;
    }

    if (this.gameState.scoreSaved) {
      alert('Результат уже сохранён!');
      return;
    }

    this.saveScoreBtn.disabled = true;
    this.saveScoreBtn.textContent = 'Сохранение...';

    try {
      await gameAPI.saveScore(playerName, this.gameState.player.coins);
      this.gameState.scoreSaved = true;
      this.saveScoreBtn.textContent = 'Сохранено!';
      
      const scores = await gameAPI.getLeaderboard(10);
      this.displayLeaderboard(scores);
    } catch (error) {
      console.error('Failed to save score:', error);
      alert('Ошибка сохранения результата');
      this.saveScoreBtn.disabled = false;
      this.saveScoreBtn.textContent = 'Сохранить результат';
    }
  }

  restart() {
    this.gameState = {
      camera: {x: 0, y: 0},
      player: {x: this.WORLD_SIZE/2, y: this.WORLD_SIZE/2, size: 20, hp: 100, maxHp: 100, speed: 3, coins: 0, attackTime: 0},
      coins: [],
      enemies: [],
      bullets: [],
      particles: [],
      keys: {},
      lastAttack: 0,
      gameOver: false,
      scoreSaved: false
    };
    
    this.generateCoins();
    this.generateEnemies();
    this.coinsEl.textContent = '0';
    this.hpEl.textContent = '100';
    this.modal.style.display = 'none';
    this.playerNameInput.value = '';
    this.saveScoreBtn.disabled = false;
    this.saveScoreBtn.textContent = 'Сохранить результат';
    this.canvas.focus();
  }

  gameLoop() {
    if (this.gameState.gameOver) {
      requestAnimationFrame(() => this.gameLoop());
      return;
    }

    this.updatePlayer();
    this.updateEnemies();
    this.updateBullets();
    this.updateCoins();
    this.updateParticles();
    this.updateCamera();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawCoins();
    this.drawBullets();
    this.drawEnemies();
    this.drawPlayer();
    this.drawParticles();

    this.hpEl.textContent = Math.max(0, this.gameState.player.hp);

    if (this.gameState.player.hp <= 0) {
      this.gameState.gameOver = true;
      this.showGameOver();
    }

    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new Game();