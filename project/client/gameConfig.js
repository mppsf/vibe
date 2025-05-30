const GAME_CONFIG = {
  // Мир и камера
  WORLD_SIZE: 4000,
  MAP_SCALE: 184 / 4000, // Уменьшен размер миникарты
  
  // Игрок
  PLAYER_SIZE: 30,
  PLAYER_SPEED: 10,
  PLAYER_MAX_HP: 100,
  
  // Атаки
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
    BULLET_SIZE: 6
  },
  
  // Враги и монеты
  ENEMY_SIZE: 20,
  COIN_SIZE: 12,
  
  // Интерфейс (уменьшен на 20%)
  UI: {
    MAIN_PANEL: {
      PADDING: 18, // было 22
      FONT_SIZE: 15, // было 19
      MIN_WIDTH: 173 // было 216
    },
    MINIMAP: {
      SIZE: 192 // было 240
    },
    PLAYER_LIST: {
      PADDING: 18, // было 22
      FONT_SIZE: 14, // было 18
      MIN_WIDTH: 307 // было 384
    },
    CONTROLS: {
      PADDING: 18, // было 22
      FONT_SIZE: 14, // было 17
      MAX_WIDTH: 288 // было 360
    },
    STATS: {
      PADDING: 18, // было 22
      FONT_SIZE: 14, // было 17
      MIN_WIDTH: 154 // было 192
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