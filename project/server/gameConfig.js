const GAME_CONFIG = {
  WORLD_SIZE: 4000,
  TICK_RATE: 60,
  MAP_SCALE: 0.15,
  
  PLAYER: {
    SIZE: 20,
    SPEED: 3,
    MAX_HP: 100,
    RESPAWN_COINS_DROP: 0.5
  },
  
  ATTACKS: {
    MELEE: {
      COOLDOWN: 500,
      RANGE: 60,
      DAMAGE: 25,
      EFFECT_DURATION: 200
    },
    RANGED: {
      COOLDOWN: 1000,
      DAMAGE: 15,
      BULLET_SPEED: 8,
      BULLET_LIFE: 120,
      BULLET_SIZE: 6
    }
  },
  
  // Обратная совместимость для клиента
  MELEE_ATTACK: {
    COOLDOWN: 500,
    RANGE: 60,
    DAMAGE: 25,
    EFFECT_DURATION: 200
  },
  
  RANGED_ATTACK: {
    COOLDOWN: 1000,
    DAMAGE: 15,
    BULLET_SPEED: 8,
    BULLET_LIFE: 120,
    BULLET_SIZE: 6
  },
  
  CONTROLS: {
    w: { dx: 0, dy: -1 },
    s: { dx: 0, dy: 1 },
    a: { dx: -1, dy: 0 },
    d: { dx: 1, dy: 0 }
  },
  
  ENEMIES: {
    TYPES: [
      { type: 'basic', hp: 40, speed: 1.2, size: 18, damage: 12, color: '#f44', dropChance: 0.25 },
      { type: 'fast', hp: 30, speed: 2.5, size: 16, damage: 8, color: '#84f', dropChance: 0.2 },
      { type: 'shooter', hp: 25, speed: 0.8, size: 18, damage: 15, color: '#4a4', shootCooldown: 1500, shootRange: 300, dropChance: 0.3 },
      { type: 'tank', hp: 80, speed: 0.6, size: 24, damage: 20, color: '#666', dropChance: 0.4 },
      { type: 'runner', hp: 20, speed: 3, size: 14, damage: 5, color: '#f84', fleeDistance: 100, dropChance: 0.15 }
    ],
    MIN_COUNT: 10,
    MAX_COUNT: 15,
    ATTACK_COOLDOWN: 1000,
    MELEE_RANGE: 35
  },
  
  COINS: {
    SIZE: 12,
    MIN_COUNT: 5,
    MAX_COUNT: 10,
    DROP_TIMEOUT: 30000,
    ENEMY_REWARD: 0,
    PICKUP_RANGE: 25
  },
  
  BULLETS: {
    ENEMY_SPEED: 3,
    COLLISION_RANGE: 20
  }
};

module.exports = GAME_CONFIG;