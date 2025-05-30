const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GAME_CONFIG = require('./gameConfig');
const GameLogic = require('./modules/gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

const gameLogic = new GameLogic(io);

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join', (data) => {
    const player = gameLogic.playerManager.addPlayer(socket.id, data);
    socket.emit('joined', { playerId: socket.id, worldSize: GAME_CONFIG.WORLD_SIZE });
  });

  socket.on('move', (data) => {
    gameLogic.playerManager.movePlayer(socket.id, data);
  });

  socket.on('meleeAttack', () => {
    const results = gameLogic.playerManager.meleeAttack(socket.id, gameLogic.enemyManager);
    if (results) {
      results.killedEnemies.forEach(enemyId => {
        socket.emit('enemyKilled', { enemyId });
      });
      results.killedPlayers.forEach(({ player, killer }) => {
        gameLogic.playerManager.handlePlayerDeath(player, gameLogic.coinManager);
        io.to(player.id).emit('death', { killerName: killer });
      });
    }
  });

  socket.on('rangedAttack', (data) => {
    gameLogic.playerManager.rangedAttack(socket.id, data, gameLogic.bulletManager);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameLogic.playerManager.removePlayer(socket.id);
  });
});

setInterval(() => {
  gameLogic.update();
  io.emit('gameState', gameLogic.getGameState());
}, 1000 / GAME_CONFIG.TICK_RATE);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});