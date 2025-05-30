# Backend API Guide для Frontend

## WebSocket соединение

```javascript
const socket = io('http://localhost:3000');
```

## События от клиента к серверу

### 1. Подключение игрока
```javascript
socket.emit('join', {
  name: 'PlayerName',
  color: '#ff0000'
});
```

### 2. Движение игрока
```javascript
socket.emit('move', {
  x: 150,
  y: 200,
  direction: 'up' // up, down, left, right
});
```

### 3. Ближняя атака
```javascript
socket.emit('meleeAttack');
```

### 4. Дальняя атака
```javascript
socket.emit('rangedAttack', {
  targetX: 300,
  targetY: 250
});
```

## События от сервера к клиенту

### 1. Успешное подключение
```javascript
socket.on('joined', (data) => {
  console.log('Player ID:', data.playerId);
  console.log('World Size:', data.worldSize);
});
```

### 2. Обновление игрового состояния
```javascript
socket.on('gameState', (state) => {
  // state содержит:
  {
    players: [
      {
        id: 'socket_id',
        name: 'PlayerName',
        x: 150,
        y: 200,
        hp: 100,
        maxHp: 100,
        coins: 5,
        color: '#ff0000',
        size: 20
      }
    ],
    enemies: [
      {
        id: 1,
        type: 'basic',
        x: 300,
        y: 400,
        hp: 40,
        maxHp: 40,
        size: 18,
        color: '#f44'
      }
    ],
    bullets: [
      {
        id: 1,
        x: 250,
        y: 300,
        vx: 5,
        vy: 3,
        damage: 15,
        fromEnemy: false,
        ownerId: 'socket_id'
      }
    ],
    coins: [
      {
        id: 1,
        x: 400,
        y: 500,
        value: 1
      }
    ],
    droppedCoins: [
      {
        id: 1,
        x: 350,
        y: 450,
        value: 1,
        timeout: 1640995200000
      }
    ]
  }
});
```

### 3. Смерть игрока
```javascript
socket.on('death', (data) => {
  console.log('Killed by:', data.killerName);
  // Показать экран смерти
});
```

### 4. Убийство врага
```javascript
socket.on('enemyKilled', (data) => {
  console.log('Enemy killed:', data.enemyId);
  // Показать эффект убийства
});
```

### 5. Убийство игрока
```javascript
socket.on('playerKilled', (data) => {
  console.log('Player killed:', data.victimId, 'by', data.killerId);
});
```

## Конфигурация игры

### Размеры и параметры
```javascript
const GAME_CONFIG = {
  WORLD_SIZE: 4000,
  
  PLAYER: {
    SIZE: 20,
    SPEED: 3,
    MAX_HP: 100
  },
  
  // Доступ через gameState или отдельный запрос
};
```

## Типы врагов

| Тип | HP | Скорость | Размер | Урон | Цвет | Особенности |
|-----|----|---------|---------|----- |------|-------------|
| basic | 40 | 1.2 | 18 | 12 | #f44 | Базовый враг |
| fast | 30 | 2.5 | 16 | 8 | #84f | Быстрый |
| shooter | 25 | 0.8 | 18 | 15 | #4a4 | Стреляет на расстоянии |
| tank | 80 | 0.6 | 24 | 20 | #666 | Танк с большим HP |
| runner | 20 | 3.0 | 14 | 5 | #f84 | Убегает при приближении |

## Система атак

### Ближняя атака
- Урон: 25
- Дальность: 60px
- Кулдаун: 500ms

### Дальняя атака
- Урон: 15
- Скорость пули: 8px/tick
- Кулдаун: 1000ms
- Время жизни пули: 120 тиков

## Система монет

### Подбор монет
- Радиус подбора: 25px
- Автоматический подбор при приближении

### Дроп с врагов
- Шанс дропа зависит от типа врага
- Монеты исчезают через 30 сек

### Дроп при смерти игрока
- Теряется 50% монет
- Монеты разбрасываются вокруг места смерти

## Обработка ошибок

```javascript
socket.on('error', (error) => {
  console.error('Game error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  // Показать экран переподключения
});
```

## Пример базовой интеграции

```javascript
class GameClient {
  constructor() {
    this.socket = io('http://localhost:3000');
    this.gameState = null;
    this.playerId = null;
    
    this.setupEvents();
  }
  
  setupEvents() {
    this.socket.on('joined', (data) => {
      this.playerId = data.playerId;
    });
    
    this.socket.on('gameState', (state) => {
      this.gameState = state;
      this.render();
    });
    
    this.socket.on('death', () => {
      this.showDeathScreen();
    });
  }
  
  joinGame(playerName) {
    this.socket.emit('join', {
      name: playerName,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
  }
  
  move(x, y) {
    this.socket.emit('move', { x, y });
  }
  
  attack() {
    this.socket.emit('meleeAttack');
  }
  
  shoot(targetX, targetY) {
    this.socket.emit('rangedAttack', { targetX, targetY });
  }
}
```

## Частота обновлений
- Игровой цикл: 60 FPS
- WebSocket события отправляются по мере необходимости
- `gameState` обновляется каждый тик (16.67ms)