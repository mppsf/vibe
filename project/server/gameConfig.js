const GAME_CONFIG = {
  // Мир и основные параметры
  WORLD_SIZE: 4000,
  TICK_RATE: 60,
  MAP_SCALE: 184 / 4000,
  
  // Игрок
  PLAYER: {
    SIZE: 20,
    SPEED: 3,
    MAX_HP: 100,
    RESPAWN_COINS_DROP: 0.5
  },
  
  // Атаки
  ATTACKS: {
    MELEE: {
      COOLDOWN: 300,
      RANGE: 60,
      DAMAGE: 25,
      EFFECT_DURATION: 300
    },
    RANGED: {
      COOLDOWN: 700,
      RANGE: 300,
      DAMAGE: 60,
      BULLET_SPEED: 8,
      BULLET_SIZE: 6,
      BULLET_LIFE: 120
    }
  },
  
  // Враги
  ENEMIES: {
    TYPES: [
      { type: 'basic', hp: 40, speed: 1.2, size: 18, damage: 12, color: '#f44', dropChance: 0.25 },
      { type: 'fast', hp: 30, speed: 2.5, size: 16, damage: 8, color: '#84f', dropChance: 0.2 },
      { type: 'shooter', hp: 25, speed: 0.8, size: 18, damage: 15, color: '#4a4', shootCooldown: 1500, shootRange: 300, dropChance: 0.3 },
      { type: 'tank', hp: 80, speed: 0.6, size: 24, damage: 20, color: '#666', dropChance: 0.4 },
      { type: 'shooter_runner', hp: 25, speed: 4.5, size: 18, damage: 10, color: '#4a4', shootCooldown: 300, fleeDistance: 100, shootRange: 300, dropChance: 0.95 },
    ],
    MIN_COUNT: 10,
    MAX_COUNT: 15,
    ATTACK_COOLDOWN: 1000,
    MELEE_RANGE: 35,
    SIZE: 18 // средний размер для клиента
  },
  
  // Монеты
  COINS: {
    SIZE: 12,
    MIN_COUNT: 5,
    MAX_COUNT: 10,
    DROP_TIMEOUT: 30000,
    ENEMY_REWARD: 0,
    PICKUP_RANGE: 25
  },
  
  // Пули
  BULLETS: {
    ENEMY_SPEED: 3,
    COLLISION_RANGE: 20
  },
  
  // Управление (общее)
  CONTROLS: {
    MOVE_UP: 'w',
    MOVE_DOWN: 's',
    MOVE_LEFT: 'a',
    MOVE_RIGHT: 'd',
    MELEE_ATTACK: ' ',
    RANGED_ATTACK: 'q',
    TOGGLE_PLAYERS: 'tab'
  },
  
  // Серверные настройки движения
  MOVEMENT: {
    w: { dx: 0, dy: -1 },
    s: { dx: 0, dy: 1 },
    a: { dx: -1, dy: 0 },
    d: { dx: 1, dy: 0 }
  },
  
  // UI (только для клиента)
  UI: {
    MAIN_PANEL: {
      PADDING: 18,
      FONT_SIZE: 15,
      MIN_WIDTH: 173
    },
    MINIMAP: {
      SIZE: 192
    },
    PLAYER_LIST: {
      PADDING: 18,
      FONT_SIZE: 14,
      MIN_WIDTH: 307
    },
    CONTROLS: {
      PADDING: 18,
      FONT_SIZE: 14,
      MAX_WIDTH: 288
    },
    STATS: {
      PADDING: 18,
      FONT_SIZE: 14,
      MIN_WIDTH: 154
    }
  },
  
  // Визуальные эффекты (только для клиента)
  VISUAL: {
    GRID_SIZE: 50,
    BORDER_SIZE: 50
  }
};

// Обратная совместимость для старого кода
GAME_CONFIG.PLAYER_SIZE = GAME_CONFIG.PLAYER.SIZE;
GAME_CONFIG.PLAYER_SPEED = GAME_CONFIG.PLAYER.SPEED;
GAME_CONFIG.PLAYER_MAX_HP = GAME_CONFIG.PLAYER.MAX_HP;
GAME_CONFIG.ENEMY_SIZE = GAME_CONFIG.ENEMIES.SIZE;
GAME_CONFIG.COIN_SIZE = GAME_CONFIG.COINS.SIZE;
GAME_CONFIG.MELEE_ATTACK = GAME_CONFIG.ATTACKS.MELEE;
GAME_CONFIG.RANGED_ATTACK = GAME_CONFIG.ATTACKS.RANGED;
GAME_CONFIG.GRID_SIZE = GAME_CONFIG.VISUAL.GRID_SIZE;
GAME_CONFIG.BORDER_SIZE = GAME_CONFIG.VISUAL.BORDER_SIZE;

// Экспорт для Node.js и браузера
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_CONFIG;
}