class UIManager {
  constructor(game) {
    this.game = game;
  }

  showNameModal() {
    const modal = document.getElementById('nameModal');
    const input = document.getElementById('playerNameInput');
    
    if (modal) modal.style.display = 'flex';
    if (input) input.focus();
  }

  joinGame() {
    const nameInput = document.getElementById('playerNameInput');
    if (!nameInput) return;
    
    const validation = GameUtils.validatePlayerName(nameInput.value);
    if (!validation.valid) {
      alert(validation.error);
      nameInput.focus();
      return;
    }
    
    this.game.socket.emit('join', { 
      name: validation.name,
      color: GameUtils.getRandomColor()
    });
    
    const playerNameEl = document.getElementById('playerName');
    if (playerNameEl) {
      playerNameEl.textContent = `Игрок: ${validation.name}`;
    }
  }

  updatePlayerStats() {
    if (!this.game.state.myPlayer) return;
    
    const coinsEl = document.getElementById('coins');
    const hpEl = document.getElementById('hp');
    
    if (coinsEl) {
      coinsEl.textContent = this.game.state.myPlayer.coins || 0;
    }
    if (hpEl) {
      const hp = GameUtils.clampHP(this.game.state.myPlayer.hp, this.game.state.myPlayer.maxHp);
      hpEl.textContent = hp;
    }
  }

  updatePlayerList() {
    const playerListContent = document.getElementById('playerListContent');
    if (!playerListContent) return;
    
    const players = Array.from(this.game.state.players.values());
    
    if (players.length === 0) {
      playerListContent.innerHTML = '<div style="text-align: center; color: #666;">Нет игроков</div>';
      return;
    }
    
    playerListContent.innerHTML = players
      .sort((a, b) => (b.coins || 0) - (a.coins || 0))
      .map(p => {
        const isMe = GameUtils.isMyPlayer(p.id, this.game.playerId);
        const hp = GameUtils.clampHP(p.hp);
        return `
          <div class="player-item ${isMe ? 'me' : ''}">
            <span class="player-name">${p.name || 'Игрок'}</span>
            <span class="player-stats">
              <span>${p.coins || 0}💰</span>
              <span>${hp}❤️</span>
            </span>
          </div>
        `;
      }).join('');
  }

  updateStats() {
    const killCountEl = document.getElementById('killCount');
    const deathCountEl = document.getElementById('deathCount');
    const gameTimeEl = document.getElementById('gameTime');
    
    if (killCountEl) {
      const totalKills = this.game.state.stats.kills + this.game.state.stats.mobKills;
      killCountEl.textContent = totalKills;
    }
    
    if (deathCountEl) {
      deathCountEl.textContent = this.game.state.stats.deaths;
    }
    
    if (gameTimeEl) {
      const elapsed = Date.now() - this.game.state.stats.startTime;
      gameTimeEl.textContent = GameUtils.formatTime(elapsed);
    }
  }

  showDeathMessage(killerName) {
    const message = killerName ? `Вас убил ${killerName}!` : 'Вы погибли!';
    alert(message);
    
    this.game.state.stats.kills = 0;
    this.game.state.stats.mobKills = 0;
  }
}