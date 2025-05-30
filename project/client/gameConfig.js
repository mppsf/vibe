const GAME_CONFIG = {
  // Мир и камера
  WORLD_SIZE: 4000,
  MAP_SCALE: 184 / 4000,
  
  // Игрок (синхронизировано с сервером)
  PLAYER_SIZE: 20, // было 30
  PLAYER_SPEED: 3, // было 15
  PLAYER_MAX_HP: 100,
  
  // Атаки (синхронизировано с сервером)
  MELEE_ATTACK: {
    COOLDOWN: 500,
    RANGE: 60,
    DAMAGE: 25,
    EFFECT_DURATION: 300
  },
  
  RANGED_ATTACK: {
    COOLDOWN: 1000,
    RANGE: 300,
    DAMAGE: 15,
    BULLET_SPEED: 8,
    BULLET_SIZE: 6,
    BULLET_LIFE: 120 // добавлено для синхронизации
  },
  
  // Враги и монеты (синхронизировано с сервером)
  ENEMY_SIZE: 18, // средний размер врагов
  COIN_SIZE: 12,
  
  // Интерфейс
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
  
  // Визуальные эффекты
  GRID_SIZE: 50,
  BORDER_SIZE: 50,
  
  // Клавиши управления
  CONTROLS: {
    MOVE_UP: 'w',
    MOVE_DOWN: 's',
    MOVE_LEFT: 'a',
    MOVE_RIGHT: 'd',
    MELEE_ATTACK: ' ',
    RANGED_ATTACK: 'q',
    TOGGLE_PLAYERS: 'tab'
  }
};