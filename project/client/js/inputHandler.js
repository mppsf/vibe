class InputHandler {
  constructor(game) {
    this.game = game;
    this.lastMeleeTime = 0;
    this.lastRangedTime = 0;
    this.lastMoveTime = 0;
    this.moveThrottle = 16;
    
    this.isMobile = this.detectMobile();
    this.touchJoystick = null;
    this.touchStartPos = null;
    this.currentTouch = null;
    this.joystickDeadZone = 20;
    this.joystickMaxDistance = 60;
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  setup() {
    this.setupKeyboard();
    if (this.isMobile) {
      this.setupMobile();
    }
    this.setupMouse();
    this.setupButtons();
  }

  setupKeyboard() {
    const removeFocus = () => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      document.body.focus();
    };

    document.addEventListener('DOMContentLoaded', removeFocus);
    removeFocus();

    document.body.setAttribute('tabindex', '0');
    document.body.focus();

    document.addEventListener('keydown', (e) => {
      if (e.target.id === 'playerNameInput') return;
      
      const key = e.key.toLowerCase();
      this.game.state.keys[key] = true;
      
      if (key === 'tab') {
        e.preventDefault();
        this.togglePlayerList();
        return;
      }
      
      // Обработка атак сразу при нажатии
      if (key === ' ') {
        e.preventDefault();
        this.handleMeleeAttack();
        removeFocus();
        return;
      }
      
      if (key === 'q') {
        e.preventDefault();
        this.handleRangedAttack();
        removeFocus();
        return;
      }
      
      const gameKeys = ['w','a','s','d'];
      if (gameKeys.includes(key)) {
        e.preventDefault();
        removeFocus();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.target.id === 'playerNameInput') return;
      
      const key = e.key.toLowerCase();
      this.game.state.keys[key] = false;
    });

    document.addEventListener('click', (e) => {
      if (e.target.id !== 'playerNameInput') {
        removeFocus();
      }
    });
  }

  setupMobile() {
    this.createMobileControls();
    this.setupTouchJoystick();
    this.setupMobileButtons();
  }

  createMobileControls() {
    const mobileControls = document.createElement('div');
    mobileControls.id = 'mobileControls';
    mobileControls.innerHTML = `
      <div id="joystickArea">
        <div id="joystickOuter">
          <div id="joystickInner"></div>
        </div>
      </div>
      <div id="mobileButtons">
        <button id="meleeBtn" class="mobile-btn melee-btn">⚔️</button>
        <button id="rangedBtn" class="mobile-btn ranged-btn">🏹</button>
      </div>
    `;
    document.body.appendChild(mobileControls);
  }

  setupTouchJoystick() {
    const joystickArea = document.getElementById('joystickArea');
    const joystickOuter = document.getElementById('joystickOuter');
    const joystickInner = document.getElementById('joystickInner');
    
    if (!joystickArea || !joystickOuter || !joystickInner) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.currentTouch = touch.identifier;
      
      const rect = joystickArea.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      joystickOuter.style.left = (touch.clientX - centerX) + 'px';
      joystickOuter.style.top = (touch.clientY - centerY) + 'px';
      joystickOuter.style.opacity = '1';
      
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!this.currentTouch || !this.touchStartPos) return;
      
      const touch = Array.from(e.touches).find(t => t.identifier === this.currentTouch);
      if (!touch) return;

      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > this.joystickDeadZone) {
        const clampedDistance = Math.min(distance, this.joystickMaxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        
        const x = Math.cos(angle) * clampedDistance;
        const y = Math.sin(angle) * clampedDistance;
        
        joystickInner.style.transform = `translate(${x}px, ${y}px)`;
        
        const moveX = x / this.joystickMaxDistance;
        const moveY = y / this.joystickMaxDistance;
        
        this.game.state.keys.w = moveY < -0.3;
        this.game.state.keys.s = moveY > 0.3;
        this.game.state.keys.a = moveX < -0.3;
        this.game.state.keys.d = moveX > 0.3;
      } else {
        this.resetMovementKeys();
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      if (!this.currentTouch) return;
      
      const touch = Array.from(e.changedTouches).find(t => t.identifier === this.currentTouch);
      if (!touch) return;

      joystickOuter.style.opacity = '0.6';
      joystickInner.style.transform = 'translate(0px, 0px)';
      
      this.resetMovementKeys();
      this.currentTouch = null;
      this.touchStartPos = null;
    };

    joystickArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystickArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystickArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    joystickArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  }

  setupMobileButtons() {
    const meleeBtn = document.getElementById('meleeBtn');
    const rangedBtn = document.getElementById('rangedBtn');
    
    if (meleeBtn) {
      meleeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleMeleeAttack();
      });
    }
    
    if (rangedBtn) {
      rangedBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleRangedAttack();
      });
    }
  }

  resetMovementKeys() {
    this.game.state.keys.w = false;
    this.game.state.keys.s = false;
    this.game.state.keys.a = false;
    this.game.state.keys.d = false;
  }

  setupMouse() {
    this.game.canvas.addEventListener('click', (e) => {
      this.handleMouseRangedAttack(e);
    });
    
    this.game.canvas.setAttribute('tabindex', '0');
  }

  setupButtons() {
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
    // Убираем обработку атак из update, т.к. теперь обрабатываем в keydown
  }

  handleMovement() {
    const now = Date.now();
    if (now - this.lastMoveTime < this.moveThrottle) return;

    const movement = GameUtils.getMovementDirection(this.game.state.keys, GAME_CONFIG.CONTROLS);
    
    if (movement.dx || movement.dy) {
      this.game.socket.emit('move', { 
        dx: movement.dx, 
        dy: movement.dy,
        direction: movement.direction 
      });
      
      this.lastMoveTime = now;
    }
  }

  handleMeleeAttack() {
    const now = Date.now();
    if (now - this.lastMeleeTime < GAME_CONFIG.MELEE_ATTACK.COOLDOWN) return;
    if (!this.game.state.myPlayer) return;
    
    this.game.socket.emit('meleeAttack');
    this.game.startMeleeAttack();
    this.lastMeleeTime = now;
  }

  handleRangedAttack() {
    const now = Date.now();
    if (now - this.lastRangedTime < GAME_CONFIG.RANGED_ATTACK.COOLDOWN) return;
    
    this.performRangedAttack();
    this.lastRangedTime = now;
  }

  performRangedAttack() {
    if (!this.game.state.myPlayer) return;

    const player = this.game.state.myPlayer;
    const movement = GameUtils.getMovementDirection(this.game.state.keys, GAME_CONFIG.CONTROLS);
    
    let vx = 0, vy = 0;

    if (movement.dx !== 0 || movement.dy !== 0) {
      const length = Math.sqrt(movement.dx * movement.dx + movement.dy * movement.dy);
      vx = movement.dx / length;
      vy = movement.dy / length;
    } else {
      vx = 1;
      vy = 0;
    }

    this.game.socket.emit('rangedAttack', { vx, vy });
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

    const player = this.game.state.myPlayer;
    const dx = mousePos.x - player.x;
    const dy = mousePos.y - player.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const vx = length > 0 ? dx / length : 1;
    const vy = length > 0 ? dy / length : 0;

    this.game.socket.emit('rangedAttack', { vx, vy });
    this.game.startRangedAttack();
    this.lastRangedTime = now;
  }

  togglePlayerList() {
    const playerList = document.getElementById('onlinePlayersList');
    if (playerList) {
      const isVisible = playerList.style.display !== 'none';
      playerList.style.display = isVisible ? 'none' : 'block';
    }
  }
}