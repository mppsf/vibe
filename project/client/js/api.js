class GameAPI {
  constructor() {
    this.baseURL = '/api';
  }

  async saveScore(playerName, score) {
    try {
      const response = await fetch(`${this.baseURL}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName, score })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save score');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Save score error:', error);
      throw error;
    }
  }

  async getLeaderboard(limit = 10) {
    try {
      const response = await fetch(`${this.baseURL}/scores?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Leaderboard error:', error);
      throw error;
    }
  }
}

const gameAPI = new GameAPI();