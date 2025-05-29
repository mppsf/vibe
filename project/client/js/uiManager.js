class UIManager {
  constructor(game) {
    this.game = game;
  }

  showNameModal() {
    const modal = document.getElementById('nameModal');
    const input = document.getElementById('playerNameInput');
    
    if (modal) {
      modal.style.display = 'flex';
    }
    if (input) {
      input.focus();
    }
  }

  joinGame() {
    const nameInput = document.getElementById('playerNameInput');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) {
      alert('Введите имя!');
      nameInput.focus();
      return;
    }
    
    this.game.socket.emit('join', { name });
    
    const playerNameEl = document.getElementById('playerName');
    if (playerNameEl) {
      playerNameEl.textContent = `Игрок: ${name}`;
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
      hpEl.textContent = Math.max(0, this.game.state.myPlayer.hp || 0);
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
        const isMe = p.id === this.game.playerId;
        return `
          <div class="player-item ${isMe ? 'me' : ''}">
            <span class="player-name">${p.name || 'Игрок'}</span>
            <span class="player-stats">
              <span>${p.coins || 0}💰</span>
              <span>${Math.max(0, p.hp || 0)}❤️</span>
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
      const elapsed = Math.floor((Date.now() - this.game.state.stats.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      gameTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  showDeathMessage(killerName) {
    alert(`Вас убил ${killerName}!`);
  }
}