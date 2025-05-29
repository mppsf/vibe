class InputHandler {
  constructor(game) {
    this.game = game;
    this.lastAttackTime = 0;
    this.attackCooldown = 500;
  }

  setup() {
    const keys = ['w','a','s','d',' ','tab'];
    
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
    this.handleAttack();
  }

  handleMovement() {
    let dx = 0, dy = 0;
    if (this.game.state.keys.w) dy = -1;
    if (this.game.state.keys.s) dy = 1;
    if (this.game.state.keys.a) dx = -1;
    if (this.game.state.keys.d) dx = 1;
    
    if (dx || dy) {
      this.game.socket.emit('move', { dx, dy });
    }
  }

  handleAttack() {
    if (this.game.state.keys[' ']) {
      const now = Date.now();
      if (now - this.lastAttackTime > this.attackCooldown) {
        this.game.socket.emit('attack');
        this.game.startAttackEffect();
        this.lastAttackTime = now;
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