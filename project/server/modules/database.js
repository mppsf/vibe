const GAME_CONFIG = {
  WORLD_SIZE: 4000,
  TICK_RATE: 60,
  
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
      DAMAGE: 25
    },
    RANGED: {
      COOLDOWN: 1000,
      DAMAGE: 15,
      BULLET_SPEED: 8,
      BULLET_LIFE: 120,
      BULLET_SIZE: 6
    }
  },
  
  ENEMIES: {
    TYPES: [
      { type: 'basic', hp: 40, speed: 1.2, size: 18, damage: 12, color: '#f44' },
      { type: 'fast', hp: 30, speed: 2.5, size: 16, damage: 8, color: '#84f' },
      { type: 'shooter', hp: 25, speed: 0.8, size: 18, damage: 15, color: '#4a4', shootCooldown: 1500, shootRange: 300 },
      { type: 'tank', hp: 80, speed: 0.6, size: 24, damage: 20, color: '#666' },
      { type: 'runner', hp: 20, speed: 3, size: 14, damage: 5, color: '#f84', fleeDistance: 100 }
    ],
    MIN_COUNT: 10,
    MAX_COUNT: 15,
    ATTACK_COOLDOWN: 1000,
    MELEE_RANGE: 35
  },
  
  COINS: {
    SIZE: 12,
    MIN_COUNT: 60,
    MAX_COUNT: 80,
    DROP_TIMEOUT: 30000,
    ENEMY_REWARD: 2,
    PICKUP_RANGE: 25
  },
  
  BULLETS: {
    ENEMY_SPEED: 3,
    COLLISION_RANGE: 20
  }
};

module.exports = GAME_CONFIG;