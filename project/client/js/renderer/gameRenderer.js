class GameRenderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.minimapCtx = game.minimapCtx;
    
    this.mapRenderer = new MapRenderer(this.ctx);
    this.entityRenderer = new EntityRenderer(this.ctx);
    this.uiRenderer = new UIRenderer(this.ctx, this.minimapCtx);
  }

  draw() {
    this.mapRenderer.drawBackground(this.game.canvas.width, this.game.canvas.height);
    this.mapRenderer.drawGrid(this.game.state.camera, this.game.canvas.width, this.game.canvas.height);
    this.mapRenderer.drawBorders(this.game.state.camera, this.game.canvas.width, this.game.canvas.height, this.game.WORLD_SIZE);
    
    this.drawEntities();
    
    this.uiRenderer.drawAttackEffect(this.game.state.attackEffect, this.game.state.myPlayer, this.game.state.camera);
    this.uiRenderer.drawMinimap(this.game.state.players, this.game.playerId, this.game.state.camera, this.game.canvas.width, this.game.canvas.height, this.game.MAP_SCALE);
  }

  drawEntities() {
    const cam = this.game.state.camera;
    const canvasW = this.game.canvas.width;
    const canvasH = this.game.canvas.height;
    
    this.entityRenderer.drawCoins(this.game.state.coins, this.game.state.droppedCoins, cam, canvasW, canvasH);
    this.entityRenderer.drawEnemies(this.game.state.enemies, cam, canvasW, canvasH);
    this.entityRenderer.drawBullets(this.game.state.bullets, cam);
    this.entityRenderer.drawPlayers(this.game.state.players, this.game.playerId, cam, canvasW, canvasH);
  }
}