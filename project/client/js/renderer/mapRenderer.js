class MapRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawBackground(canvasWidth, canvasHeight) {
    const gradient = this.ctx.createRadialGradient(
      canvasWidth / 2, canvasHeight / 2, 0,
      canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight)
    );
    gradient.addColorStop(0, '#2d2d2d');
    gradient.addColorStop(1, '#1a1a1a');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  drawGrid(cam, canvasWidth, canvasHeight) {
    this.ctx.strokeStyle = '#404040';
    this.ctx.lineWidth = 1;
    const size = 50;
    const startX = Math.floor(cam.x / size) * size;
    const startY = Math.floor(cam.y / size) * size;
    
    this.ctx.globalAlpha = 0.3;
    
    for (let x = startX; x < cam.x + canvasWidth + size; x += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - cam.x, 0);
      this.ctx.lineTo(x - cam.x, canvasHeight);
      this.ctx.stroke();
    }
    for (let y = startY; y < cam.y + canvasHeight + size; y += size) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y - cam.y);
      this.ctx.lineTo(canvasWidth, y - cam.y);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }

  drawBorders(cam, canvasWidth, canvasHeight, worldSize) {
    this.ctx.strokeStyle = '#ff4444';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#ff4444';
    this.ctx.shadowBlur = 10;
    
    const border = 50;
    
    if (cam.x < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(border - cam.x, 0);
      this.ctx.lineTo(border - cam.x, canvasHeight);
      this.ctx.stroke();
    }
    if (cam.x + canvasWidth > worldSize - border - 10) {
      const x = worldSize - border - cam.x;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvasHeight);
      this.ctx.stroke();
    }
    if (cam.y < border + 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, border - cam.y);
      this.ctx.lineTo(canvasWidth, border - cam.y);
      this.ctx.stroke();
    }
    if (cam.y + canvasHeight > worldSize - border - 10) {
      const y = worldSize - border - cam.y;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvasWidth, y);
      this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
  }
}