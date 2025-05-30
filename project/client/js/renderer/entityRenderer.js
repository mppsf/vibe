class EntityRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawCoins(coins, droppedCoins, cam, canvasWidth, canvasHeight) {
    [...coins, ...droppedCoins].forEach(coin => {
      const x = coin.x - cam.x;
      const y = coin.y - cam.y;
      if (x > -30 && x < canvasWidth + 30 && y > -30 && y < canvasHeight + 30) {
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffed4e';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawEnemies(enemies, cam, canvasWidth, canvasHeight) {
    enemies.forEach(enemy => {
      const x = enemy.x - cam.x;
      const y = enemy.y - cam.y;
      const size = (enemy.size || 20) * 1.5;
      if (x > -45 && x < canvasWidth + 45 && y > -45 && y < canvasHeight + 45) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - size/2 + 3, y - size/2 + 3, size, size);
        
        this.ctx.fillStyle = enemy.color || '#ff6b6b';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        
        this.drawHealthBar(x, y, enemy.hp || 0, enemy.maxHp || 100, size);
      }
    });
  }

  drawBullets(bullets, cam) {
    bullets.forEach(bullet => {
      const x = bullet.x - cam.x;
      const y = bullet.y - cam.y;
      
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.fillRect(x - 6, y - 6, 12, 12);
      
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(x - 3, y - 3, 6, 6);
    });
  }

  drawPlayers(players, playerId, cam, canvasWidth, canvasHeight) {
    players.forEach(player => {
      const x = player.x - cam.x;
      const y = player.y - cam.y;
      if (x > -45 && x < canvasWidth + 45 && y > -45 && y < canvasHeight + 45) {
        const isMe = player.id === playerId;
        const size = 30;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - size/2 + 3, y - size/2 + 3, size, size);
        
        if (isMe) {
          this.ctx.shadowColor = '#2196F3';
          this.ctx.shadowBlur = 15;
        }
        
        this.ctx.fillStyle = isMe ? '#2196F3' : '#ff6b6b';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        this.ctx.shadowBlur = 0;
        
        this.drawHealthBar(x, y, Math.max(0, player.hp || 0), 100, size);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(player.name || 'Игрок', x, y + 35);
        this.ctx.fillText(player.name || 'Игрок', x, y + 35);
      }
    });
  }

  drawHealthBar(x, y, hp, maxHp, entitySize = 20) {
    const barWidth = entitySize + 10;
    const barHeight = 6;
    const offsetY = entitySize / 2 + 8;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - barWidth/2, y - offsetY, barWidth, barHeight);
    
    const hpPercent = hp / maxHp;
    this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
    this.ctx.fillRect(x - barWidth/2, y - offsetY, hpPercent * barWidth, barHeight);
    
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - barWidth/2, y - offsetY, barWidth, barHeight);
  }
}