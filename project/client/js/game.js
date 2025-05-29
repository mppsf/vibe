class Game {
  constructor() {
    if (typeof io === 'undefined') {
      console.error('Socket.IO не найден');
      alert('Socket.IO библиотека не загружена. Проверьте подключение к интернету.');
      return;
    }

    try {
      this.socket = io();
      this.socket.on('connect', () => console.log('Socket подключен'));
      this.socket.on('connect_error', (error) => {
        console.error('Ошибка подключения:', error);
        alert('Сервер недоступен. Запустите серверную часть.');
      });
    } catch (error) {
      console.error('Ошибка инициализации Socket.IO:', error);
      alert('Ошибка подключения к серверу');
      return;
    }

    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.minimap = document.getElementById('minimap');
    this.minimapCtx = this.minimap.getContext('2d');
    
    this.playerId = null;
    this.WORLD_SIZE = 4000;
    this.MAP_SCALE = 230 / this.WORLD_SIZE;
    
    this.state = {
      camera: {x: 0, y: 0},
      myPlayer: null,
      players: new Map(),
      coins: [],
      enemies: [],
      bullets: [],
      droppedCoins: [],
      keys: {},
      attackEffect: null,
      attackCooldown: {
        active: false,
        startTime: 0,
        duration: 500
      },
      stats: {
        kills: 0,
        mobKills: 0,
        deaths: 0,
        startTime: Date.now()
      }
    };

    this.modules = {};
    this.initModules();
  }

  initModules() {
    this.modules.renderer = new GameRenderer(this);
    this.modules.input = new InputHandler(this);
    this.modules.ui = new UIManager(this);
    this.modules.network = new NetworkManager(this);
    
    this.init();
  }

  init() {
    this.resize();
    this.modules.input.setup();
    this.modules.network.setup();
    this.modules.ui.showNameModal();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  canAttack() {
    return !this.state.attackCooldown.active;
  }

  startAttack() {
    if (!this.canAttack() || !this.state.myPlayer) return false;
    
    this.startAttackEffect();
    this.startAttackCooldown();
    return true;
  }

  startAttackEffect() {
    if (!this.state.myPlayer) return;
    this.state.attackEffect = {
      radius: 0,
      maxRadius: 60,
      duration: 300,
      startTime: Date.now()
    };
  }

  startAttackCooldown() {
    this.state.attackCooldown.active = true;
    this.state.attackCooldown.startTime = Date.now();
    document.getElementById('attackCooldown').style.display = 'block';
  }

  updateAttackEffect() {
    if (!this.state.attackEffect) return;
    
    const elapsed = Date.now() - this.state.attackEffect.startTime;
    const progress = elapsed / this.state.attackEffect.duration;
    
    if (progress >= 1) {
      this.state.attackEffect = null;
      return;
    }
    
    this.state.attackEffect.radius = this.state.attackEffect.maxRadius * progress;
  }

  updateAttackCooldown() {
    if (!this.state.attackCooldown.active) return;
    
    const elapsed = Date.now() - this.state.attackCooldown.startTime;
    const progress = elapsed / this.state.attackCooldown.duration;
    
    if (progress >= 1) {
      this.state.attackCooldown.active = false;
      document.getElementById('attackCooldown').style.display = 'none';
      return;
    }
    
    const progressBar = document.querySelector('.cooldown-progress');
    if (progressBar) {
      progressBar.style.width = `${(1 - progress) * 100}%`;
    }
  }

  addKill(type = 'player') {
    if (type === 'mob') {
      this.state.stats.mobKills++;
    } else {
      this.state.stats.kills++;
    }
    this.modules.ui.updateStats();
  }

  onDeath() {
    this.state.stats.kills = 0;
    this.state.stats.mobKills = 0;
    this.state.stats.deaths++;
    this.modules.ui.updateStats();
  }

  updateCamera() {
    if (!this.state.myPlayer) return;
    const p = this.state.myPlayer;
    this.state.camera.x = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.width, p.x - this.canvas.width / 2));
    this.state.camera.y = Math.max(0, Math.min(this.WORLD_SIZE - this.canvas.height, p.y - this.canvas.height / 2));
  }

  gameLoop() {
    this.modules.input.update();
    this.updateCamera();
    this.updateAttackEffect();
    this.updateAttackCooldown();
    this.modules.renderer.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new Game();