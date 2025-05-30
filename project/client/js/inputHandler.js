class InputHandler {
  constructor(game) {
    this.game = game;
    this.lastMeleeTime = 0;
    this.lastRangedTime = 0;
    this.lastMoveTime = 0;
    this.moveThrottle = 50;
  }

  setup() {
    // Убираем фокус с элементов при загрузке
    document.addEventListener('DOMContentLoaded', () => {
      document.activeElement?.blur();
    });
    
    // Сразу убираем фокус
    if (document.activeElement) {
      document.activeElement.blur();
    }

    document.addEventListener('keydown', (e) => {
      // Игнорируем если фокус на input
      if (e.target.tagName === 'INPUT') return;
      
      const key = e.key.toLowerCase();
      console.log('Нажата клавиша:', key); // Отладка
      
      this.game.state.keys[key] = true;
      
      // Обработка Tab
      if (key === 'tab') {
        e.preventDefault();
        this.togglePlayerList();
        return;
      }
      
      // Предотвращаем стандартное поведение для игровых клавиш
      const gameKeys = ['w','a','s','d',' ','q'];
      if (gameKeys.includes(key)) {
        e.preventDefault();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      const key = e.key.toLowerCase();
      this.game.state.keys[key] = false;
    });

    // Обработка кликов мыши
    this.game.canvas.addEventListener('click', (e) => {
      // Убираем фокус с любых элементов при клике на канвас
      if (document.activeElement) {
        document.activeElement.blur();
      }
      
      if (this.game.state.keys['q']) return;
      this.handleMouseRangedAttack(e);
    });
    
    // Убеждаемся что канвас может получать фокус
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus();
    
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

    const movement = GameUtils.getMovementDirection(this.game.state.keys, GAME_CONFIG.CONTROLS);
    
    if (movement.dx || movement.dy) {
      const player = this.game.state.myPlayer;
      const newPos = GameUtils.clampToWorld(
        player.x + movement.dx * GAME_CONFIG.PLAYER_SPEED,
        player.y + movement.dy * GAME_CONFIG.PLAYER_SPEED,
        this.game.WORLD_SIZE
      );
      
      this.game.socket.emit('move', { 
        x: newPos.x, 
        y: newPos.y, 
        direction: movement.direction 
      });
      
      this.lastMoveTime = now;
    }
  }

  handleAttacks() {
    const now = Date.now();
    
    // Ближняя атака (пробел)
    if (this.game.state.keys[' ']) {
      if (now - this.lastMeleeTime > GAME_CONFIG.MELEE_ATTACK.COOLDOWN) {
        console.log('Ближняя атака!'); // Отладка
        this.game.socket.emit('meleeAttack');
        this.game.startMeleeAttack();
        this.lastMeleeTime = now;
      }
    }
    
    // Дальняя атака (Q)
    if (this.game.state.keys['q']) {
      if (now - this.lastRangedTime > GAME_CONFIG.RANGED_ATTACK.COOLDOWN) {
        console.log('Дальняя атака!'); // Отладка
        this.performRangedAttack();
        this.lastRangedTime = now;
      }
    }
  }

  performRangedAttack() {
    if (!this.game.state.myPlayer) return;

    const player = this.game.state.myPlayer;
    const movement = GameUtils.getMovementDirection(this.game.state.keys, GAME_CONFIG.CONTROLS);
    let targetX = player.x;
    let targetY = player.y;

    if (movement.dx || movement.dy) {
      targetX += movement.dx * GAME_CONFIG.RANGED_ATTACK.RANGE;
      targetY += movement.dy * GAME_CONFIG.RANGED_ATTACK.RANGE;
    } else {
      const centerOffset = GameUtils.screenToWorld(
        this.game.canvas.width / 2,
        this.game.canvas.height / 2,
        this.game.state.camera
      );
      targetX += (centerOffset.x - player.x) * 0.3;
      targetY += (centerOffset.y - player.y) * 0.3;
    }

    this.game.socket.emit('rangedAttack', { targetX, targetY });
    this.game.startRangedAttack();
  }

  handleMouseRangedAttack(e) {
    const now = Date.now();
    if (now - this.lastRangedTime < GAME_CONFIG.RANGED_ATTACK.COOLDOWN) return;
    if (!this.game.state.myPlayer) return;

    const rect = this.game.canvas.getBoundingClientRect();
    const mousePos = GameUtils.screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      this.game.state.camera
    );

    this.game.socket.emit('rangedAttack', { 
      targetX: mousePos.x, 
      targetY: mousePos.y 
    });
    
    this.game.startRangedAttack();
    this.lastRangedTime = now;
  }

  togglePlayerList() {
    const playerList = document.getElementById('onlinePlayersList');
    if (playerList) {
      const isVisible = playerList.style.display !== 'none';
      playerList.style.display = isVisible ? 'none' : 'block';
      console.log('Список игроков:', !isVisible ? 'показан' : 'скрыт'); // Отладка
    }
  }
}