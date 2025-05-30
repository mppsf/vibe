class InputHandler {
  constructor(game) {
    this.game = game;
    this.lastMeleeTime = 0;
    this.lastRangedTime = 0;
    this.lastMoveTime = 0;
    this.moveThrottle = 50; // Ограничение частоты отправки движения
  }

  setup() {
    const keys = ['w','a','s','d',' ','q','tab'];
    
    document.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();
      this.game.state.keys[key] = true;
      
      if (key === 'tab') {
        e.preventDefault();
        this.togglePlayerList();
      }
      
      if (keys.includes(key)) e.preventDefault();
    });
    
    document.addEventListener('keyup', e => {
      this.game.state.keys[e.key.toLowerCase()] = false;
    });

    // Обработчик для дальней атаки по клику мыши (опционально)
    this.game.canvas.addEventListener('click', (e) => {
      if (this.game.state.keys['q']) return; // Если уже нажата клавиша Q
      this.handleMouseRangedAttack(e);
    });
    
    const joinBtn = document.getElementById('joinBtn');
    const nameInput = document.getElementById('playerNameInput');
    
    if (joinBtn) {
      joinBtn.addEventListener('click', () => this.game.modules.ui.joinGame());
    }
    
    if (nameInput) {
      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.game.modules.ui.joinGame();
        }
      });
    }
  }

  update() {
    if (!this.game.state.myPlayer) return;
    
    this.handleMovement();
    this.handleAttacks();
  }

  handleMovement() {
    const now = Date.now();
    if (now - this.lastMoveTime < this.moveThrottle) return;

    let dx = 0, dy = 0;
    let direction = null;

    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_UP]) {
      dy = -1;
      direction = 'up';
    }
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_DOWN]) {
      dy = 1;
      direction = 'down';
    }
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_LEFT]) {
      dx = -1;
      direction = 'left';
    }
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_RIGHT]) {
      dx = 1;
      direction = 'right';
    }

    // Диагональное движение
    if (dx && dy) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
    }
    
    if (dx || dy) {
      const player = this.game.state.myPlayer;
      const newX = Math.max(0, Math.min(this.game.WORLD_SIZE, player.x + dx * GAME_CONFIG.PLAYER_SPEED));
      const newY = Math.max(0, Math.min(this.game.WORLD_SIZE, player.y + dy * GAME_CONFIG.PLAYER_SPEED));
      
      this.game.socket.emit('move', { 
        x: newX, 
        y: newY, 
        direction: direction 
      });
      
      this.lastMoveTime = now;
    }
  }

  handleAttacks() {
    const now = Date.now();
    
    // Ближняя атака (пробел)
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MELEE_ATTACK]) {
      if (now - this.lastMeleeTime > GAME_CONFIG.MELEE_ATTACK.COOLDOWN) {
        this.game.socket.emit('meleeAttack');
        this.game.startMeleeAttack();
        this.lastMeleeTime = now;
      }
    }
    
    // Дальняя атака (Q) - атака в направлении движения или по центру экрана
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.RANGED_ATTACK]) {
      if (now - this.lastRangedTime > GAME_CONFIG.RANGED_ATTACK.COOLDOWN) {
        this.performRangedAttack();
        this.lastRangedTime = now;
      }
    }
  }

  performRangedAttack() {
    if (!this.game.state.myPlayer) return;

    const player = this.game.state.myPlayer;
    let targetX = player.x;
    let targetY = player.y;

    // Определяем направление атаки на основе текущего движения
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_UP]) {
      targetY -= GAME_CONFIG.RANGED_ATTACK.RANGE;
    } else if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_DOWN]) {
      targetY += GAME_CONFIG.RANGED_ATTACK.RANGE;
    } else if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_LEFT]) {
      targetX -= GAME_CONFIG.RANGED_ATTACK.RANGE;
    } else if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_RIGHT]) {
      targetX += GAME_CONFIG.RANGED_ATTACK.RANGE;
    } else {
      // Если не двигаемся, стреляем в центр экрана
      targetX = player.x + (this.game.canvas.width / 2 - player.x + this.game.state.camera.x) * 0.3;
      targetY = player.y + (this.game.canvas.height / 2 - player.y + this.game.state.camera.y) * 0.3;
    }

    this.game.socket.emit('rangedAttack', { 
      targetX: targetX, 
      targetY: targetY 
    });
    
    this.game.startRangedAttack();
  }

  handleMouseRangedAttack(e) {
    const now = Date.now();
    if (now - this.lastRangedTime < GAME_CONFIG.RANGED_ATTACK.COOLDOWN) return;
    if (!this.game.state.myPlayer) return;

    const rect = this.game.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Конвертируем координаты мыши в мировые координаты
    const worldX = mouseX + this.game.state.camera.x;
    const worldY = mouseY + this.game.state.camera.y;

    this.game.socket.emit('rangedAttack', { 
      targetX: worldX, 
      targetY: worldY 
    });
    
    this.game.startRangedAttack();
    this.lastRangedTime = now;
  }

  togglePlayerList() {
    const playerList = document.getElementById('onlinePlayersList');
    if (playerList) {
      playerList.style.display = playerList.style.display === 'none' ? 'block' : 'none';
    }
  }
}