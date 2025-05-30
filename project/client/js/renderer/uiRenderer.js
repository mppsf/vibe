class UIRenderer {
  constructor(ctx, minimapCtx) {
    this.ctx = ctx;
    this.minimapCtx = minimapCtx;
  }

  drawAttackEffect(effect, myPlayer, cam) {
    if (!effect || !myPlayer) return;
    
    const x = myPlayer.x - cam.x;
    const y = myPlayer.y - cam.y;
    
    const alpha = 1 - (effect.radius / effect.maxRadius);
    this.ctx.globalAlpha = alpha * 0.6;
    this.ctx.strokeStyle = '#2196F3';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, effect.radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  drawMinimap(players, playerId, cam, canvasWidth, canvasHeight, mapScale) {
    this.minimapCtx.fillStyle = '#1a1a1a';
    this.minimapCtx.fillRect(0, 0, 160, 160);
    
    this.minimapCtx.strokeStyle = '#555';
    this.minimapCtx.lineWidth = 2;
    this.minimapCtx.strokeRect(0, 0, 160, 160);
    
    this.minimapCtx.strokeStyle = '#ff4444';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(2, 2, 156, 156);
    
    players.forEach(player => {
      const x = player.x * mapScale;
      const y = player.y * mapScale;
      const isMe = player.id === playerId;
      
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
    
    this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.minimapCtx.lineWidth = 1;
    const camX = cam.x * mapScale;
    const camY = cam.y * mapScale;
    const camW = canvasWidth * mapScale;
    const camH = canvasHeight * mapScale;
    this.minimapCtx.strokeRect(camX, camY, camW, camH);
  }
}