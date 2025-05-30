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
    this.WORLD_SIZE = GAME_CONFIG.WORLD_SIZE;
    this.MAP_SCALE = GAME_CONFIG.MAP_SCALE;
    this.gameStarted = false;
    
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
      cooldowns: {
        melee: {
          active: false,
          startTime: 0,
          duration: GAME_CONFIG.MELEE_ATTACK.COOLDOWN
        },
        ranged: {
          active: false,
          startTime: 0,
          duration: GAME_CONFIG.RANGED_ATTACK.COOLDOWN
        }
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

  startGameLoop() {
    if (this.gameStarted) return;
    this.gameStarted = true;
    console.log('Запуск игрового цикла');
    this.gameLoop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  canAttack(type = 'melee') {
    return !this.state.cooldowns[type].active;
  }

  startMeleeAttack() {
    if (!this.canAttack('melee') || !this.state.myPlayer) return false;
    
    this.startAttackEffect();
    this.startCooldown('melee');
    return true;
  }

  startRangedAttack() {
    if (!this.canAttack('ranged') || !this.state.myPlayer) return false;
    
    this.startCooldown('ranged');
    return true;
  }

  startAttackEffect() {
    if (!this.state.myPlayer) return;
    this.state.attackEffect = {
      radius: 0,
      maxRadius: GAME_CONFIG.MELEE_ATTACK.RANGE,
      duration: GAME_CONFIG.MELEE_ATTACK.EFFECT_DURATION,
      startTime: Date.now()
    };
  }

  startCooldown(type) {
    this.state.cooldowns[type].active = true;
    this.state.cooldowns[type].startTime = Date.now();
    document.getElementById(`${type}Cooldown`).style.display = 'block';
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

  updateCooldowns() {
    ['melee', 'ranged'].forEach(type => {
      if (!this.state.cooldowns[type].active) return;
      
      const elapsed = Date.now() - this.state.cooldowns[type].startTime;
      const progress = elapsed / this.state.cooldowns[type].duration;
      
      if (progress >= 1) {
        this.state.cooldowns[type].active = false;
        document.getElementById(`${type}Cooldown`).style.display = 'none';
        return;
      }
      
      const progressBar = document.querySelector(`#${type}Cooldown .cooldown-progress`);
      if (progressBar) {
        progressBar.style.width = `${(1 - progress) * 100}%`;
      }
    });
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
    if (!this.gameStarted) return;
    
    this.modules.input.update();
    this.updateCamera();
    this.updateAttackEffect();
    this.updateCooldowns();
    this.modules.renderer.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new Game();