import { GAME, GameState, BUNKER, MYSTERY_SHIP } from './constants.js';
import { CanvasRenderer } from './renderer/canvas-renderer.js';
import { Starfield } from './renderer/starfield.js';
import { InputHandler } from './managers/input-handler.js';
import { EnemyManager } from './managers/enemy-manager.js';
import { ProjectileManager } from './managers/projectile-manager.js';
import { CollisionDetector } from './managers/collision-detector.js';
import { ScoreManager } from './managers/score-manager.js';
import { NameEntryManager } from './managers/name-entry-manager.js';
import { SoundManager } from './audio/sound-manager.js';
import { Player } from './entities/player.js';
import { Bunker } from './entities/bunker.js';
import { MysteryShip } from './entities/mystery-ship.js';
import { randomInt } from './utils/helpers.js';

/**
 * Main game class - orchestrates all game systems
 */
export class Game {
  constructor() {
    // Core systems
    this.renderer = new CanvasRenderer('gameCanvas');
    this.starfield = new Starfield();
    this.input = new InputHandler();
    this.enemyManager = new EnemyManager();
    this.projectileManager = new ProjectileManager();
    this.scoreManager = new ScoreManager();
    this.nameEntryManager = new NameEntryManager();
    this.soundManager = new SoundManager();

    // Game state
    this.state = GameState.MENU;
    this.level = 1;
    this.lastTime = 0;

    // Entities
    this.player = null;
    this.bunkers = [];
    this.mysteryShip = null;
    this.mysteryShipTimer = 0;
    this.nextMysteryShipTime = this.getNextMysteryShipTime();

    // Explosions for visual effect
    this.explosions = [];

    // Level transition
    this.levelTransitionTimer = 0;
    this.levelTransitionDuration = 2000;

    // Name entry tracking
    this.newHighScoreRank = 0;

    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
  }

  /**
   * Initialize and start the game
   */
  start() {
    this.input.start();

    // First interaction initializes audio
    const initAudio = () => {
      this.soundManager.init();
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('keydown', initAudio);
    document.addEventListener('click', initAudio);

    // Start game loop
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Main game loop
   * @param {number} currentTime - Current timestamp
   */
  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap delta time to prevent physics issues
    const cappedDelta = Math.min(deltaTime, 50);

    // Poll gamepad state each frame (required for gamepad API)
    this.input.pollGamepads();

    this.update(cappedDelta);
    this.render();

    // Clear just pressed keys at end of frame
    this.input.clearJustPressed();

    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Update game state
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Always update starfield (renders in all states)
    this.starfield.update(deltaTime);

    // Handle mute toggle in any state
    if (this.input.isMuteJustPressed()) {
      this.soundManager.toggleMute();
    }

    switch (this.state) {
      case GameState.MENU:
        this.updateMenu();
        break;
      case GameState.PLAYING:
        this.updatePlaying(deltaTime);
        break;
      case GameState.PAUSED:
        this.updatePaused();
        break;
      case GameState.GAME_OVER:
        this.updateGameOver();
        break;
      case GameState.LEVEL_COMPLETE:
        this.updateLevelComplete(deltaTime);
        break;
      case GameState.NAME_ENTRY:
        this.updateNameEntry(deltaTime);
        break;
    }

    // Always update explosions
    this.updateExplosions(deltaTime);
  }

  /**
   * Update menu state
   */
  updateMenu() {
    if (this.input.isFireJustPressed()) {
      this.startNewGame();
    }
  }

  /**
   * Update playing state
   * @param {number} deltaTime
   */
  updatePlaying(deltaTime) {
    // Pause toggle
    if (this.input.isPauseJustPressed()) {
      this.state = GameState.PAUSED;
      return;
    }

    // Player input
    if (this.input.isLeftHeld()) {
      this.player.moveLeft();
    }
    if (this.input.isRightHeld()) {
      this.player.moveRight();
    }
    if (this.input.isFireHeld()) {
      const shot = this.player.shoot(this.lastTime);
      if (shot) {
        if (this.projectileManager.addPlayerProjectile(shot)) {
          this.soundManager.playShoot();
          // Light haptic feedback on shoot
          this.input.vibrate(0.15, 50);
        }
      }
    }

    // Update entities
    this.player.update(deltaTime);

    // Update enemies and get their shots
    const enemyShots = this.enemyManager.update(deltaTime);
    for (const shot of enemyShots) {
      this.projectileManager.addEnemyProjectile(shot);
      this.soundManager.playEnemyShoot();
    }

    // Update projectiles
    this.projectileManager.update(deltaTime);

    // Update mystery ship
    this.updateMysteryShip(deltaTime);

    // Update screen shake
    this.renderer.updateShake(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Check win/lose conditions
    this.checkGameConditions();
  }

  /**
   * Update paused state
   */
  updatePaused() {
    if (this.input.isPauseJustPressed()) {
      this.state = GameState.PLAYING;
    }
  }

  /**
   * Update game over state
   */
  updateGameOver() {
    if (this.input.isRestartJustPressed()) {
      this.startNewGame();
    }
  }

  /**
   * Update level complete state
   * @param {number} deltaTime
   */
  updateLevelComplete(deltaTime) {
    this.levelTransitionTimer += deltaTime;

    if (this.levelTransitionTimer >= this.levelTransitionDuration) {
      this.startNextLevel();
    }
  }

  /**
   * Update name entry state
   * @param {number} deltaTime
   */
  updateNameEntry(deltaTime) {
    // Check if delay after confirmation is complete
    if (this.nameEntryManager.isConfirmed()) {
      if (this.nameEntryManager.update(deltaTime)) {
        // Transition to game over screen (now showing high scores)
        this.state = GameState.GAME_OVER;
      }
      return;
    }

    // Handle direct character input (typing letters)
    const typedChar = this.input.getTypedChar();
    if (typedChar) {
      const isComplete = this.nameEntryManager.inputChar(typedChar);
      this.soundManager.playShoot(); // Use shoot sound for feedback
      if (isComplete) {
        this.saveHighScore();
      }
      return;
    }

    // Handle up/down for character selection
    if (this.input.isUpJustPressed()) {
      this.nameEntryManager.nextChar();
      this.soundManager.playShoot();
    }
    if (this.input.isDownJustPressed()) {
      this.nameEntryManager.prevChar();
      this.soundManager.playShoot();
    }

    // Handle left/right for cursor movement
    if (this.input.isLeftJustPressed()) {
      this.nameEntryManager.prevPosition();
    }
    if (this.input.isRightJustPressed()) {
      this.nameEntryManager.nextPosition();
    }

    // Handle confirm (advance or submit)
    if (this.input.isConfirmJustPressed()) {
      const isComplete = this.nameEntryManager.confirm();
      this.soundManager.playShoot();
      if (isComplete) {
        this.saveHighScore();
      }
    }
  }

  /**
   * Save high score after name entry
   */
  saveHighScore() {
    const initials = this.nameEntryManager.getInitials();
    this.newHighScoreRank = this.scoreManager.addHighScore(initials);
    this.soundManager.playLevelComplete();
  }

  /**
   * Update mystery ship spawning and movement
   * @param {number} deltaTime
   */
  updateMysteryShip(deltaTime) {
    if (this.mysteryShip) {
      this.mysteryShip.update(deltaTime);
      if (!this.mysteryShip.active) {
        this.mysteryShip = null;
        this.nextMysteryShipTime = this.getNextMysteryShipTime();
      }
    } else {
      this.mysteryShipTimer += deltaTime;
      if (this.mysteryShipTimer >= this.nextMysteryShipTime) {
        this.spawnMysteryShip();
        this.mysteryShipTimer = 0;
      }
    }
  }

  /**
   * Update explosion animations
   * @param {number} deltaTime
   */
  updateExplosions(deltaTime) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer += deltaTime;
      this.explosions[i].frame = Math.floor(this.explosions[i].timer / 50);

      if (this.explosions[i].frame > 6) {
        this.explosions.splice(i, 1);
      }
    }
  }

  /**
   * Check all collisions
   */
  checkCollisions() {
    const playerProjectiles = this.projectileManager.getActivePlayerProjectiles();
    const enemyProjectiles = this.projectileManager.getActiveEnemyProjectiles();
    const enemies = this.enemyManager.getActiveEnemies();

    // Player projectiles vs enemies
    const enemyHits = CollisionDetector.checkPlayerProjectilesVsEnemies(
      playerProjectiles,
      enemies
    );
    for (const { projectile, enemy } of enemyHits) {
      projectile.deactivate();
      const points = this.enemyManager.removeEnemy(enemy);
      this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      this.soundManager.playExplosion();

      const earnedExtraLife = this.scoreManager.addPoints(points);
      if (earnedExtraLife) {
        this.player.lives++;
        this.soundManager.playPowerUp();
      }
    }

    // Player projectiles vs mystery ship
    if (this.mysteryShip) {
      const mysteryHit = CollisionDetector.checkPlayerProjectilesVsMysteryShip(
        playerProjectiles,
        this.mysteryShip
      );
      if (mysteryHit) {
        mysteryHit.projectile.deactivate();
        const points = this.mysteryShip.getPoints();
        this.addExplosion(
          this.mysteryShip.x + this.mysteryShip.width / 2,
          this.mysteryShip.y + this.mysteryShip.height / 2
        );
        this.soundManager.playExplosion();
        this.scoreManager.addPoints(points);
        this.mysteryShip = null;
      }
    }

    // Enemy projectiles vs player
    const playerHit = CollisionDetector.checkEnemyProjectilesVsPlayer(
      enemyProjectiles,
      this.player
    );
    if (playerHit) {
      playerHit.deactivate();
      const isDead = this.player.hit();
      this.soundManager.playPlayerHit();
      this.renderer.shake(10, 300);

      // Haptic feedback on hit (strong vibration)
      this.input.vibrate(0.8, 300);

      if (isDead) {
        this.gameOver();
      }
    }

    // Projectiles vs bunkers
    const allProjectiles = [...playerProjectiles, ...enemyProjectiles];
    const bunkerHits = CollisionDetector.checkProjectilesVsBunkers(
      allProjectiles,
      this.bunkers
    );
    for (const { projectile } of bunkerHits) {
      projectile.deactivate();
    }

    // Enemies vs bunkers (damage bunkers when enemies descend)
    const enemyBunkerHits = CollisionDetector.checkEnemiesVsBunkers(
      enemies,
      this.bunkers
    );
    for (const { bunker } of enemyBunkerHits) {
      // Damage the bunker pixels where enemy touches
      bunker.damageArea(
        Math.floor(bunker.cols / 2),
        Math.floor(bunker.rows / 2),
        3
      );
    }
  }

  /**
   * Check win/lose conditions
   */
  checkGameConditions() {
    // Win: All enemies destroyed
    if (this.enemyManager.isEmpty()) {
      this.levelComplete();
      return;
    }

    // Lose: Enemies reached bottom or player
    if (this.enemyManager.hasReachedBottom()) {
      this.gameOver();
      return;
    }

    if (
      CollisionDetector.checkEnemiesVsPlayer(
        this.enemyManager.getActiveEnemies(),
        this.player
      )
    ) {
      this.gameOver();
    }
  }

  /**
   * Start a new game
   */
  startNewGame() {
    this.level = 1;
    this.scoreManager.reset();
    this.projectileManager.clear();
    this.explosions = [];
    this.mysteryShip = null;
    this.mysteryShipTimer = 0;
    this.newHighScoreRank = 0;

    this.player = new Player();
    this.createBunkers();
    this.enemyManager.createFormation();

    this.state = GameState.PLAYING;
    this.soundManager.resume();
  }

  /**
   * Start the next level
   */
  startNextLevel() {
    this.level++;
    this.projectileManager.clear();
    this.explosions = [];
    this.mysteryShip = null;
    this.mysteryShipTimer = 0;
    this.levelTransitionTimer = 0;

    // Recreate bunkers only every 3 levels
    if (this.level % 3 === 1) {
      this.createBunkers();
    }

    this.enemyManager.createFormation();
    this.state = GameState.PLAYING;
  }

  /**
   * Handle level completion
   */
  levelComplete() {
    this.state = GameState.LEVEL_COMPLETE;
    this.levelTransitionTimer = 0;
    this.soundManager.playLevelComplete();
  }

  /**
   * Handle game over
   */
  gameOver() {
    // Update level in score manager for high score tracking
    this.scoreManager.setLevel(this.level);

    // Check if player achieved a high score
    if (this.scoreManager.isHighScore()) {
      // Show name entry screen
      this.nameEntryManager.reset();
      this.newHighScoreRank = this.scoreManager.getScoreRank();
      this.state = GameState.NAME_ENTRY;
      this.soundManager.playPowerUp(); // Play celebratory sound
    } else {
      // Regular game over
      this.state = GameState.GAME_OVER;
      this.soundManager.playGameOver();
    }
  }

  /**
   * Create defensive bunkers
   */
  createBunkers() {
    this.bunkers = [];
    const bunkerY = 450;
    const totalWidth = BUNKER.COUNT * BUNKER.WIDTH + (BUNKER.COUNT - 1) * 80;
    const startX = (GAME.WIDTH - totalWidth) / 2;

    for (let i = 0; i < BUNKER.COUNT; i++) {
      const x = startX + i * (BUNKER.WIDTH + 80);
      this.bunkers.push(new Bunker(x, bunkerY));
    }
  }

  /**
   * Spawn mystery ship
   */
  spawnMysteryShip() {
    const fromLeft = Math.random() < 0.5;
    this.mysteryShip = new MysteryShip(fromLeft);
    this.soundManager.playMysteryShip();
  }

  /**
   * Get random time until next mystery ship
   * @returns {number} Time in ms
   */
  getNextMysteryShipTime() {
    return randomInt(MYSTERY_SHIP.MIN_INTERVAL, MYSTERY_SHIP.MAX_INTERVAL);
  }

  /**
   * Add explosion effect
   * @param {number} x
   * @param {number} y
   */
  addExplosion(x, y) {
    this.explosions.push({ x, y, frame: 0, timer: 0 });
  }

  /**
   * Render the game
   */
  render() {
    const ctx = this.renderer.getContext();
    const controllerStatus = this.input.getControllerStatus();
    const hasController = controllerStatus.connected;
    const highScores = this.scoreManager.getTopHighScores(5);

    switch (this.state) {
      case GameState.MENU:
        // Draw starfield background, then start screen with high scores
        this.renderer.clear();
        this.starfield.draw(ctx);
        this.renderer.drawStartScreenWithScores(controllerStatus, highScores);
        break;

      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.LEVEL_COMPLETE:
        this.renderGame();

        if (this.state === GameState.PAUSED) {
          this.renderer.drawPause(hasController);
        } else if (this.state === GameState.LEVEL_COMPLETE) {
          this.renderer.drawLevelComplete(this.level);
        }
        break;

      case GameState.NAME_ENTRY:
        this.renderGame();
        this.renderer.drawNameEntry(
          this.scoreManager.getScore(),
          this.newHighScoreRank,
          this.nameEntryManager.initials,
          this.nameEntryManager.getCurrentPosition(),
          this.nameEntryManager.isConfirmed(),
          hasController
        );
        break;

      case GameState.GAME_OVER:
        this.renderGame();
        this.renderer.drawGameOver(
          this.scoreManager.getScore(),
          this.scoreManager.getHighScore(),
          hasController
        );
        break;
    }
  }

  /**
   * Render the main game view
   */
  renderGame() {
    const ctx = this.renderer.getContext();

    this.renderer.clear();

    // Draw starfield (background - behind all game elements)
    this.starfield.draw(ctx);

    // Draw bunkers
    for (const bunker of this.bunkers) {
      bunker.draw(ctx);
    }

    // Draw enemies
    this.enemyManager.draw(ctx);

    // Draw mystery ship
    if (this.mysteryShip) {
      this.mysteryShip.draw(ctx);
    }

    // Draw player
    this.player.draw(ctx);

    // Draw projectiles
    this.projectileManager.draw(ctx);

    // Draw explosions
    for (const exp of this.explosions) {
      this.renderer.drawExplosion(exp.x, exp.y, exp.frame);
    }

    // Draw HUD with controller status
    const controllerStatus = this.input.getControllerStatus();
    this.renderer.drawHUD(
      this.scoreManager.getScore(),
      this.scoreManager.getHighScore(),
      this.player.lives,
      this.level,
      controllerStatus
    );
  }
}
