class GameUtils {
  static validatePlayerName(name) {
    if (!name || !name.trim()) {
      return { valid: false, error: 'Введите имя!' };
    }
    if (name.trim().length > 15) {
      return { valid: false, error: 'Имя слишком длинное! Максимум 15 символов.' };
    }
    return { valid: true, name: name.trim() };
  }

  static clampHP(hp, maxHp = 100) {
    return Math.max(0, Math.min(maxHp, hp || 0));
  }

  static isInViewport(x, y, camera, canvasWidth, canvasHeight, margin = 45) {
    const screenX = x - camera.x;
    const screenY = y - camera.y;
    return screenX > -margin && screenX < canvasWidth + margin && 
           screenY > -margin && screenY < canvasHeight + margin;
  }

  static worldToScreen(worldX, worldY, camera) {
    return {
      x: worldX - camera.x,
      y: worldY - camera.y
    };
  }

  static screenToWorld(screenX, screenY, camera) {
    return {
      x: screenX + camera.x,
      y: screenY + camera.y
    };
  }

  static isMyPlayer(playerId, currentPlayerId) {
    return playerId === currentPlayerId;
  }

  static formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  static clampToWorld(x, y, worldSize) {
    return {
      x: Math.max(0, Math.min(worldSize, x)),
      y: Math.max(0, Math.min(worldSize, y))
    };
  }

  static getMovementDirection(keys, controls) {
    let dx = 0, dy = 0, direction = null;

    if (keys[controls.MOVE_UP]) {
      dy = -1;
      direction = 'up';
    }
    if (keys[controls.MOVE_DOWN]) {
      dy = 1;
      direction = 'down';
    }
    if (keys[controls.MOVE_LEFT]) {
      dx = -1;
      direction = 'left';
    }
    if (keys[controls.MOVE_RIGHT]) {
      dx = 1;
      direction = 'right';
    }

    if (dx && dy) {
      direction = Math.abs(dx) >= Math.abs(dy) ? 
        (dx > 0 ? 'right' : 'left') : 
        (dy > 0 ? 'down' : 'up');
    }

    return { dx, dy, direction };
  }

  static getHealthBarColor(hpPercent) {
    return hpPercent > 0.5 ? '#4CAF50' : 
           hpPercent > 0.25 ? '#FF9800' : '#F44336';
  }

  static drawShadowedRect(ctx, x, y, width, height, color, shadowOffset = 3) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + shadowOffset, y + shadowOffset, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
}