class EntityRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawCoins(coins, droppedCoins, cam, canvasWidth, canvasHeight) {
    [...coins, ...droppedCoins].forEach(coin => {
      if (!GameUtils.isInViewport(coin.x, coin.y, cam, canvasWidth, canvasHeight, 30)) return;
      
      const pos = GameUtils.worldToScreen(coin.x, coin.y, cam);
      
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 20;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#ffed4e';
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawEnemies(enemies, cam, canvasWidth, canvasHeight) {
    enemies.forEach(enemy => {
      const size = (enemy.size || 20) * 1.5;
      if (!GameUtils.isInViewport(enemy.x, enemy.y, cam, canvasWidth, canvasHeight, size)) return;
      
      const pos = GameUtils.worldToScreen(enemy.x, enemy.y, cam);
      
      GameUtils.drawShadowedRect(
        this.ctx, 
        pos.x - size/2, 
        pos.y - size/2, 
        size, 
        size, 
        enemy.color || '#ff6b6b'
      );
      
      this.drawHealthBar(pos.x, pos.y, enemy.hp || 0, enemy.maxHp || 100, size);
    });
  }

  drawBullets(bullets, cam) {
    bullets.forEach(bullet => {
      const pos = GameUtils.worldToScreen(bullet.x, bullet.y, cam);
      
      GameUtils.drawShadowedRect(this.ctx, pos.x - 3, pos.y - 3, 6, 6, '#ffff00');
    });
  }

  drawPlayers(players, playerId, cam, canvasWidth, canvasHeight) {
    players.forEach(player => {
      if (!GameUtils.isInViewport(player.x, player.y, cam, canvasWidth, canvasHeight)) return;
      
      const pos = GameUtils.worldToScreen(player.x, player.y, cam);
      const isMe = GameUtils.isMyPlayer(player.id, playerId);
      const size = 30;
      
      if (isMe) {
        this.ctx.shadowColor = '#2196F3';
        this.ctx.shadowBlur = 15;
      }
      
      GameUtils.drawShadowedRect(
        this.ctx, 
        pos.x - size/2, 
        pos.y - size/2, 
        size, 
        size, 
        isMe ? '#2196F3' : '#ff6b6b'
      );
      
      this.ctx.shadowBlur = 0;
      
      const hp = GameUtils.clampHP(player.hp);
      this.drawHealthBar(pos.x, pos.y, hp, 100, size);
      
      this.drawPlayerName(pos.x, pos.y + 35, player.name || 'Игрок');
    });
  }

  drawPlayerName(x, y, name) {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Courier New';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(name, x, y);
    this.ctx.fillText(name, x, y);
  }

  drawHealthBar(x, y, hp, maxHp, entitySize = 20) {
    const barWidth = entitySize + 10;
    const barHeight = 6;
    const offsetY = entitySize / 2 + 8;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - barWidth/2, y - offsetY, barWidth, barHeight);
    
    const hpPercent = hp / maxHp;
    this.ctx.fillStyle = GameUtils.getHealthBarColor(hpPercent);
    this.ctx.fillRect(x - barWidth/2, y - offsetY, hpPercent * barWidth, barHeight);
    
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - barWidth/2, y - offsetY, barWidth, barHeight);
  }
}