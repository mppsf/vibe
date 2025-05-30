class InputHandler {
  constructor(game) {
    this.game = game;
    this.lastMeleeTime = 0;
    this.lastRangedTime = 0;
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
    let dx = 0, dy = 0;
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_UP]) dy = -1;
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_DOWN]) dy = 1;
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_LEFT]) dx = -1;
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.MOVE_RIGHT]) dx = 1;
    
    if (dx || dy) {
      this.game.socket.emit('move', { dx, dy });
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
    
    // Дальняя атака (Q)
    if (this.game.state.keys[GAME_CONFIG.CONTROLS.RANGED_ATTACK]) {
      if (now - this.lastRangedTime > GAME_CONFIG.RANGED_ATTACK.COOLDOWN) {
        this.game.socket.emit('rangedAttack');
        this.game.startRangedAttack();
        this.lastRangedTime = now;
      }
    }
  }

  togglePlayerList() {
    const playerList = document.getElementById('onlinePlayersList');
    if (playerList) {
      playerList.style.display = playerList.style.display === 'none' ? 'block' : 'none';
    }
  }
}