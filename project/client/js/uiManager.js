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

    if (name.length > 15) {
      alert('Имя слишком длинное! Максимум 15 символов.');
      nameInput.focus();
      return;
    }
    
    // Отправляем данные согласно API
    this.game.socket.emit('join', { 
      name: name,
      color: '#' + Math.floor(Math.random()*16777215).toString(16) // Случайный цвет
    });
    
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
      const hp = Math.max(0, Math.min(this.game.state.myPlayer.maxHp || 100, this.game.state.myPlayer.hp || 0));
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
        const isMe = p.id === this.game.playerId;
        const hp = Math.max(0, p.hp || 0);
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
      const elapsed = Math.floor((Date.now() - this.game.state.stats.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      gameTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  showDeathMessage(killerName) {
    // Можно заменить на более красивое уведомление
    const message = killerName ? `Вас убил ${killerName}!` : 'Вы погибли!';
    alert(message);
    
    // Сброс статистики убийств при смерти
    this.game.state.stats.kills = 0;
    this.game.state.stats.mobKills = 0;
  }
}