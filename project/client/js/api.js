class GameAPI {
  constructor() {
    this.baseURL = '/api';
    this.playerId = null;
    this.lastUpdate = 0;
  }

  async joinGame(playerName) {
    const response = await fetch(`${this.baseURL}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
    });
    const data = await response.json();
    this.playerId = data.playerId;
    return data;
  }

  async updatePlayer(playerData) {
    if (Date.now() - this.lastUpdate < 50) return;
    this.lastUpdate = Date.now();
    
    await fetch(`${this.baseURL}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: this.playerId, ...playerData })
    });
  }

  async getGameState() {
    const response = await fetch(`${this.baseURL}/state`);
    return await response.json();
  }

  async attack(x, y) {
    await fetch(`${this.baseURL}/attack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: this.playerId, x, y })
    });
  }

  async leaveGame() {
    if (this.playerId) {
      await fetch(`${this.baseURL}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: this.playerId })
      });
    }
  }

  async saveScore(score) {
    await fetch(`${this.baseURL}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: this.playerId, score })
    });
  }
}

const gameAPI = new GameAPI();