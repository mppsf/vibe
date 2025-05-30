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
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      window.innerWidth <= 768 ||
      "ontouchstart" in window
    );
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

    document.addEventListener("DOMContentLoaded", removeFocus);
    removeFocus();

    document.body.setAttribute("tabindex", "0");
    document.body.focus();

    document.addEventListener("keydown", (e) => {
      if (e.target.id === "playerNameInput") return;

      const key = e.key.toLowerCase();
      this.game.state.keys[key] = true;

      if (key === "tab") {
        e.preventDefault();
        this.togglePlayerList();
        return;
      }

      if (key === " ") {
        e.preventDefault();
        this.handleMeleeAttack();
        removeFocus();
        return;
      }

      if (key === "q") {
        e.preventDefault();
        this.handleRangedAttack();
        removeFocus();
        return;
      }

      const gameKeys = ["w", "a", "s", "d"];
      if (gameKeys.includes(key)) {
        e.preventDefault();
        removeFocus();
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.target.id === "playerNameInput") return;

      const key = e.key.toLowerCase();
      this.game.state.keys[key] = false;
    });

    document.addEventListener("click", (e) => {
      if (e.target.id !== "playerNameInput") {
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
    const mobileControls = document.createElement("div");
    mobileControls.id = "mobileControls";
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
    const joystickArea = document.getElementById("joystickArea");
    const joystickOuter = document.getElementById("joystickOuter");
    const joystickInner = document.getElementById("joystickInner");

    if (!joystickArea || !joystickOuter || !joystickInner) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.currentTouch = touch.identifier;

      const rect = joystickArea.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      joystickOuter.style.left = touch.clientX - centerX + "px";
      joystickOuter.style.top = touch.clientY - centerY + "px";
      joystickOuter.style.opacity = "1";

      this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!this.currentTouch || !this.touchStartPos) return;

      const touch = Array.from(e.touches).find(
        (t) => t.identifier === this.currentTouch
      );
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

      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === this.currentTouch
      );
      if (!touch) return;

      joystickOuter.style.opacity = "0.6";
      joystickInner.style.transform = "translate(0px, 0px)";

      this.resetMovementKeys();
      this.currentTouch = null;
      this.touchStartPos = null;
    };

    joystickArea.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    joystickArea.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    joystickArea.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });
    joystickArea.addEventListener("touchcancel", handleTouchEnd, {
      passive: false,
    });
  }

  setupMobileButtons() {
    const meleeBtn = document.getElementById("meleeBtn");
    const rangedBtn = document.getElementById("rangedBtn");

    if (meleeBtn) {
      meleeBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.handleMeleeAttack();
      });
    }

    if (rangedBtn) {
      rangedBtn.addEventListener("touchstart", (e) => {
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
    this.game.canvas.addEventListener("click", (e) => {
      this.handleMouseRangedAttack(e);
    });

    this.game.canvas.setAttribute("tabindex", "0");
  }

  setupButtons() {
    const joinBtn = document.getElementById("joinBtn");
    const nameInput = document.getElementById("playerNameInput");

    if (joinBtn) {
      joinBtn.addEventListener("click", () => this.game.modules.ui.joinGame());
    }

    if (nameInput) {
      nameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.game.modules.ui.joinGame();
        }
      });
    }
  }

  update() {
    if (!this.game.state.myPlayer) return;
    this.handleMovement();
  }

  handleMovement() {
    const now = Date.now();
    if (now - this.lastMoveTime < this.moveThrottle) return;

    // Используем собственную реализацию вместо GameUtils
    let dx = 0,
      dy = 0;

    if (this.game.state.keys.w) dy -= 1;
    if (this.game.state.keys.s) dy += 1;
    if (this.game.state.keys.a) dx -= 1;
    if (this.game.state.keys.d) dx += 1;

    // Нормализация диагонального движения
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    let direction = "down";
    if (dx > 0) direction = "right";
    else if (dx < 0) direction = "left";
    else if (dy > 0) direction = "down";
    else if (dy < 0) direction = "up";

    if (dx || dy) {
      this.game.socket.emit("move", { dx, dy, direction });
      this.lastMoveTime = now;
    }
  }

  handleMeleeAttack() {
    const now = Date.now();
    if (now - this.lastMeleeTime < GAME_CONFIG.ATTACKS.MELEE.COOLDOWN) return;
    if (!this.game.state.myPlayer) return;

    this.game.socket.emit("meleeAttack");
    this.game.startMeleeAttack();
    this.lastMeleeTime = now;
  }

  handleRangedAttack() {
    const now = Date.now();
    if (now - this.lastRangedTime < GAME_CONFIG.ATTACKS.RANGED.COOLDOWN) return;

    this.performRangedAttack();
    this.lastRangedTime = now;
  }

  findNearestEnemy() {
    if (!this.game.state.myPlayer) return null;
    
    const myPos = this.game.state.myPlayer;
    const searchRadius = 300;
    let nearestTarget = null;
    let nearestDistance = Infinity;
    
    // Приоритет 1: другие игроки
    this.game.state.players.forEach(player => {
      if (player.id === this.game.playerId) return;
      
      const dist = Math.sqrt((player.x - myPos.x) ** 2 + (player.y - myPos.y) ** 2);
      if (dist <= searchRadius && dist < nearestDistance) {
        nearestDistance = dist;
        nearestTarget = player;
      }
    });
    
    // Приоритет 2: мобы (только если нет игроков поблизости)
    if (!nearestTarget) {
      this.game.state.enemies.forEach(enemy => {
        const dist = Math.sqrt((enemy.x - myPos.x) ** 2 + (enemy.y - myPos.y) ** 2);
        if (dist <= searchRadius && dist < nearestDistance) {
          nearestDistance = dist;
          nearestTarget = enemy;
        }
      });
    }
    
    return nearestTarget;
  }
  performRangedAttack() {
    if (!this.game.state.myPlayer) return;

    const target = this.findNearestEnemy();
    let vx = 0,
      vy = 0;

    if (target) {
      const dx = target.x - this.game.state.myPlayer.x;
      const dy = target.y - this.game.state.myPlayer.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 0) {
        vx = dx / length;
        vy = dy / length;
      }
    } else {
      // Если врагов нет, стреляем в направлении движения
      if (this.game.state.keys.w) vy -= 1;
      if (this.game.state.keys.s) vy += 1;
      if (this.game.state.keys.a) vx -= 1;
      if (this.game.state.keys.d) vx += 1;

      if (vx === 0 && vy === 0) vx = 1;

      const length = Math.sqrt(vx * vx + vy * vy);
      if (length > 0) {
        vx /= length;
        vy /= length;
      }
    }

    this.game.socket.emit("rangedAttack", { vx, vy });
    this.game.startRangedAttack();
  }

  togglePlayerList() {
    const playerList = document.getElementById("onlinePlayersList");
    if (playerList) {
      const isVisible = playerList.style.display !== "none";
      playerList.style.display = isVisible ? "none" : "block";
    }
  }
}
