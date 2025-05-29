class GameRenderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.minimapCtx = game.minimapCtx;
  }

  draw() {
    this.drawBackground();
    this.drawGrid();
    this.drawBorders();
    this.drawEntities();
    this.drawAttackEffect();
    this.drawMinimap();
  }

  drawBackground() {
    const gradient = this.ctx.createRadialGradient(
      this.game.canvas.width / 2, this.game.canvas.height / 2, 0,
      this.game.canvas.width / 2, this.game.canvas.height / 2, Math.max(this.game.canvas.width, this.game.canvas.height)
    );
    gradient.addColorStop(0, '#2d2d2d');
    gradient.addColorStop(1, '#1a1a1a');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
  }

  drawGrid() {
    this.ctx.strokeStyle = '#404040';
    this.ctx.lineWidth = 1;
    const size = 50;
    const startX = Math.floor(this.game.state.camera.x / size) * size;
    const startY = Math.floor(this.game.state.camera.y / size) * size;
    
    this.ctx.globalAlpha = 0.3;
    
    for (let x = startX; x < this.game.state.camera.x + this.game.canvas.width + size; x += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - this.game.state.camera.x, 0);
      this.ctx.lineTo(x - this.game.state.camera.x, this.game.canvas.height);
      this.ctx.stroke();
    }
    for (let y = startY; y < this.game.state.camera.y + this.game.canvas.height + size; y += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y - this.game.state.camera.y);
      this.ctx.lineTo(this.game.canvas.width, y - this.game.state.camera.y);
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
    const cam = this.game.state.camera;
    
    if (cam.x < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(border - cam.x, 0);
      this.ctx.lineTo(border - cam.x, this.game.canvas.height);
      this.ctx.stroke();
    }
    if (cam.x + this.game.canvas.width > this.game.WORLD_SIZE - border - 10) {
      const x = this.game.WORLD_SIZE - border - cam.x;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.game.canvas.height);
      this.ctx.stroke();
    }
    if (cam.y < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, border - cam.y);
      this.ctx.lineTo(this.game.canvas.width, border - cam.y);
      this.ctx.stroke();
    }
    if (cam.y + this.game.canvas.height > this.game.WORLD_SIZE - border - 10) {
      const y = this.game.WORLD_SIZE - border - cam.y;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.game.canvas.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
  }

  drawEntities() {
    const cam = this.game.state.camera;
    
    this.drawCoins(cam);
    this.drawEnemies(cam);
    this.drawBullets(cam);
    this.drawPlayers(cam);
  }

  drawCoins(cam) {
    [...this.game.state.coins, ...this.game.state.droppedCoins].forEach(coin => {
      const x = coin.x - cam.x;
      const y = coin.y - cam.y;
      if (x > -20 && x < this.game.canvas.width + 20 && y > -20 && y < this.game.canvas.height + 20) {
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffed4e';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawEnemies(cam) {
    this.game.state.enemies.forEach(enemy => {
      const x = enemy.x - cam.x;
      const y = enemy.y - cam.y;
      if (x > -30 && x < this.game.canvas.width + 30 && y > -30 && y < this.game.canvas.height + 30) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - enemy.size/2 + 2, y - enemy.size/2 + 2, enemy.size, enemy.size);
        
        this.ctx.fillStyle = enemy.color || '#ff6b6b';
        this.ctx.fillRect(x - enemy.size/2, y - enemy.size/2, enemy.size, enemy.size);
        
        this.drawHealthBar(x, y, enemy.hp || 0, enemy.maxHp || 100);
      }
    });
  }

  drawBullets(cam) {
    this.game.state.bullets.forEach(bullet => {
      const x = bullet.x - cam.x;
      const y = bullet.y - cam.y;
      
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.fillRect(x - 4, y - 4, 8, 8);
      
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(x - 2, y - 2, 4, 4);
    });
  }

  drawPlayers(cam) {
    this.game.state.players.forEach(player => {
      const x = player.x - cam.x;
      const y = player.y - cam.y;
      if (x > -30 && x < this.game.canvas.width + 30 && y > -30 && y < this.game.canvas.height + 30) {
        const isMe = player.id === this.game.playerId;
        const size = 20;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - size/2 + 2, y - size/2 + 2, size, size);
        
        if (isMe) {
          this.ctx.shadowColor = '#2196F3';
          this.ctx.shadowBlur = 10;
        }
        
        this.ctx.fillStyle = isMe ? '#2196F3' : '#ff6b6b';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        this.ctx.shadowBlur = 0;
        
        this.drawHealthBar(x, y, Math.max(0, player.hp || 0), 100);
        
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

  drawHealthBar(x, y, hp, maxHp) {
    const barWidth = 26;
    const barHeight = 5;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - barWidth/2, y - 20, barWidth, barHeight);
    
    const hpPercent = hp / maxHp;
    this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
    this.ctx.fillRect(x - barWidth/2, y - 20, hpPercent * barWidth, barHeight);
    
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - barWidth/2, y - 20, barWidth, barHeight);
  }

  drawAttackEffect() {
    if (!this.game.state.attackEffect) return;
    
    const effect = this.game.state.attackEffect;
    const x = effect.x - this.game.state.camera.x;
    const y = effect.y - this.game.state.camera.y;
    
    const alpha = 1 - (effect.radius / effect.maxRadius);
    this.ctx.globalAlpha = alpha * 0.6;
    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, effect.radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  drawMinimap() {
    this.minimapCtx.fillStyle = '#1a1a1a';
    this.minimapCtx.fillRect(0, 0, 160, 160);
    
    this.minimapCtx.strokeStyle = '#555';
    this.minimapCtx.lineWidth = 2;
    this.minimapCtx.strokeRect(0, 0, 160, 160);
    
    this.minimapCtx.strokeStyle = '#ff4444';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(2, 2, 156, 156);
    
    this.game.state.players.forEach(player => {
      const x = player.x * this.game.MAP_SCALE;
      const y = player.y * this.game.MAP_SCALE;
      const isMe = player.id === this.game.playerId;
      
      this.minimapCtx.fillStyle = isMe ? '#2196F3' : '#ff6b6b';
      this.minimapCtx.fillRect(x - 2, y - 2, 4, 4);
      
      if (isMe) {
        this.minimapCtx.strokeStyle = '#2196F3';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(x, y, 6, 0, Math.PI * 2);
        this.minimapCtx.stroke();
      }
    });
    
    if (this.game.state.myPlayer) {
      this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.minimapCtx.lineWidth = 1;
      const camX = this.game.state.camera.x * this.game.MAP_SCALE;
      const camY = this.game.state.camera.y * this.game.MAP_SCALE;
      const camW = this.game.canvas.width * this.game.MAP_SCALE;
      const camH = this.game.canvas.height * this.game.MAP_SCALE;
      this.minimapCtx.strokeRect(camX, camY, camW, camH);
    }
  }
}