import { GAME, GameState, GameMode, BUNKER, MYSTERY_SHIP, ENDLESS_MODE, POWERUPS, MUSIC } from './constants.js';
import { CanvasRenderer } from './renderer/canvas-renderer.js';
import { Starfield } from './renderer/starfield.js';
import { TouchControlsRenderer } from './renderer/touch-controls-renderer.js';
import { InputHandler } from './managers/input-handler.js';
import { EnemyManager } from './managers/enemy-manager.js';
import { ProjectileManager } from './managers/projectile-manager.js';
import { CollisionDetector } from './managers/collision-detector.js';
import { ScoreManager } from './managers/score-manager.js';
import { NameEntryManager } from './managers/name-entry-manager.js';
import { PowerUpManager } from './managers/power-up-manager.js';
import { SoundManager } from './audio/sound-manager.js';
import { MusicManager } from './audio/music-manager.js';
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
    this.touchControlsRenderer = new TouchControlsRenderer();
    this.input = new InputHandler();
    this.enemyManager = new EnemyManager();
    this.projectileManager = new ProjectileManager();
    this.scoreManager = new ScoreManager();
    this.nameEntryManager = new NameEntryManager();
    this.powerUpManager = new PowerUpManager();
    this.soundManager = new SoundManager();
    this.musicManager = null; // Initialized after soundManager.init()

    // Music state
    this.musicEnabled = true;
    this.currentMusicTrack = null;

    // Game state
    this.state = GameState.MENU;
    this.level = 1;
    this.wave = 1;
    this.gameMode = GameMode.CLASSIC;
    this.selectedModeIndex = 0; // 0 = CLASSIC, 1 = ENDLESS (for mode select UI)
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

      // Initialize music manager with shared audio context
      const audioContext = this.soundManager.getAudioContext();
      const masterGain = this.soundManager.getMasterGain();
      if (audioContext && masterGain) {
        this.musicManager = new MusicManager(audioContext, masterGain);
        this.musicManager.init();
        // Start title music
        this.musicManager.playTrack('title');
        this.currentMusicTrack = 'title';
      }

      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('keydown', initAudio);
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);

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

    // Handle mute toggle in any state (M key mutes both SFX and music)
    if (this.input.isMuteJustPressed()) {
      this.soundManager.toggleMute();
      if (this.musicManager) {
        this.musicManager.toggleMute();
      }
    }

    switch (this.state) {
      case GameState.MENU:
        this.updateMenu();
        break;
      case GameState.MODE_SELECT:
        this.updateModeSelect();
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
      // Transition to mode select screen
      this.state = GameState.MODE_SELECT;
      this.selectedModeIndex = 0; // Default to classic
    }
  }

  /**
   * Update mode select state
   */
  updateModeSelect() {
    // Handle up/down for mode selection
    if (this.input.isUpJustPressed()) {
      this.selectedModeIndex = 0; // CLASSIC
      this.soundManager.playShoot();
    }
    if (this.input.isDownJustPressed()) {
      this.selectedModeIndex = 1; // ENDLESS
      this.soundManager.playShoot();
    }

    // Handle confirm (Enter/Space/A)
    if (this.input.isConfirmJustPressed() || this.input.isFireJustPressed()) {
      // Set game mode based on selection
      this.gameMode = this.selectedModeIndex === 0 ? GameMode.CLASSIC : GameMode.ENDLESS;

      // Update managers with game mode
      this.scoreManager.setGameMode(this.gameMode);
      this.enemyManager.setGameMode(this.gameMode);

      // Start the game
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
      if (this.musicManager) {
        this.musicManager.pause();
      }
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
      const shots = this.player.shoot(this.lastTime);
      if (shots) {
        if (this.projectileManager.addPlayerProjectile(shots)) {
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

    // Update power-ups
    this.powerUpManager.update(deltaTime, this.lastTime);
    this.syncPowerUpEffects();

    // Update mystery ship
    this.updateMysteryShip(deltaTime);

    // Update screen shake
    this.renderer.updateShake(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Check win/lose conditions
    this.checkGameConditions();

    // Dynamic music switching in endless mode (battle -> boss at wave 10+)
    if (this.musicManager && this.gameMode === GameMode.ENDLESS) {
      const shouldPlayBoss = this.wave >= MUSIC.BOSS_WAVE_THRESHOLD;
      const currentTrack = this.musicManager.getCurrentTrack();

      if (shouldPlayBoss && currentTrack === 'battle') {
        this.musicManager.fadeToTrack('boss');
        this.currentMusicTrack = 'boss';
      }
    }
  }

  /**
   * Sync power-up effects from manager to player
   */
  syncPowerUpEffects() {
    // Sync fire rate multiplier
    this.player.setFireRateMultiplier(this.powerUpManager.getFireRateMultiplier());

    // Sync multi-shot config
    this.player.setMultiShotConfig(this.powerUpManager.getMultiShotConfig());

    // Sync shield (only set if manager has it, player doesn't lose it from manager)
    if (this.powerUpManager.hasShield() && !this.player.hasShield()) {
      this.player.setShield(true);
    }
  }

  /**
   * Update paused state
   */
  updatePaused() {
    if (this.input.isPauseJustPressed()) {
      this.state = GameState.PLAYING;
      if (this.musicManager) {
        this.musicManager.resume();
      }
    }
  }

  /**
   * Update game over state
   */
  updateGameOver() {
    if (this.input.isRestartJustPressed()) {
      // Return to menu instead of directly starting new game
      this.state = GameState.MENU;
      // Play title music
      if (this.musicManager) {
        this.musicManager.fadeToTrack('title');
        this.currentMusicTrack = 'title';
      }
    }
  }

  /**
   * Update level complete state
   * @param {number} deltaTime
   */
  updateLevelComplete(deltaTime) {
    this.levelTransitionTimer += deltaTime;

    if (this.levelTransitionTimer >= this.levelTransitionDuration) {
      if (this.gameMode === GameMode.ENDLESS) {
        this.startNextWave();
      } else {
        this.startNextLevel();
      }
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
    // Play title music for high score display/return to menu
    if (this.musicManager) {
      this.musicManager.fadeToTrack('title');
      this.currentMusicTrack = 'title';
    }
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
    const powerUps = this.powerUpManager.getActivePowerUps();

    // Player projectiles vs enemies
    const enemyHits = CollisionDetector.checkPlayerProjectilesVsEnemies(
      playerProjectiles,
      enemies
    );
    for (const { projectile, enemy } of enemyHits) {
      projectile.deactivate();
      const points = this.enemyManager.removeEnemy(enemy);
      const enemyCenterX = enemy.x + enemy.width / 2;
      const enemyCenterY = enemy.y + enemy.height / 2;
      this.addExplosion(enemyCenterX, enemyCenterY);
      this.soundManager.playExplosion();

      // Try to spawn a power-up at enemy location
      if (this.powerUpManager.trySpawn(enemyCenterX, enemyCenterY)) {
        this.soundManager.playPowerUpSpawn();
      }

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
        const shipCenterX = this.mysteryShip.x + this.mysteryShip.width / 2;
        const shipCenterY = this.mysteryShip.y + this.mysteryShip.height / 2;
        this.addExplosion(shipCenterX, shipCenterY);
        this.soundManager.playExplosion();
        this.scoreManager.addPoints(points);

        // Mystery ships have higher power-up drop chance
        if (Math.random() < 0.5) {
          this.powerUpManager.trySpawn(shipCenterX, shipCenterY);
          this.soundManager.playPowerUpSpawn();
        }

        this.mysteryShip = null;
      }
    }

    // Power-ups vs player
    const collectedPowerUps = CollisionDetector.checkPowerUpsVsPlayer(
      powerUps,
      this.player
    );
    for (const powerUp of collectedPowerUps) {
      powerUp.deactivate();
      this.handlePowerUpCollection(powerUp);
    }

    // Enemy projectiles vs player
    const playerHit = CollisionDetector.checkEnemyProjectilesVsPlayer(
      enemyProjectiles,
      this.player
    );
    if (playerHit) {
      playerHit.deactivate();
      const hitResult = this.player.hit();

      if (hitResult.shieldConsumed) {
        // Shield absorbed the hit
        this.soundManager.playShieldBreak();
        this.powerUpManager.consumeShield();
        this.renderer.shake(5, 150);
        this.input.vibrate(0.3, 150);
      } else if (hitResult.died) {
        this.soundManager.playPlayerHit();
        this.renderer.shake(10, 300);
        this.input.vibrate(0.8, 300);
        this.gameOver();
      } else {
        // Hit but not dead (lost a life)
        this.soundManager.playPlayerHit();
        this.renderer.shake(10, 300);
        this.input.vibrate(0.8, 300);
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
   * Handle power-up collection
   * @param {PowerUp} powerUp - The collected power-up
   */
  handlePowerUpCollection(powerUp) {
    const result = this.powerUpManager.activateEffect(powerUp.type, this.lastTime);
    this.soundManager.playPowerUp();

    switch (powerUp.type) {
      case 'SHIELD':
        this.player.setShield(true);
        this.soundManager.playShieldActivate();
        break;

      case 'BOMB':
        // Clear all enemies (no points for bomb kills)
        const enemies = this.enemyManager.getActiveEnemies();
        for (const enemy of enemies) {
          this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          enemy.deactivate();
        }
        this.soundManager.playBombExplosion();
        this.renderer.shake(15, 500);
        this.input.vibrate(1.0, 500);
        break;

      case 'EXTRA_LIFE':
        this.player.lives++;
        break;

      // RAPID_FIRE and MULTI_SHOT are handled by syncPowerUpEffects
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
    this.wave = 1;
    this.scoreManager.reset();
    this.projectileManager.clear();
    this.powerUpManager.reset();
    this.explosions = [];
    this.mysteryShip = null;
    this.mysteryShipTimer = 0;
    this.newHighScoreRank = 0;

    // Set wave in managers for endless mode
    this.enemyManager.setWave(1);
    this.scoreManager.setWave(1);

    this.player = new Player();
    this.createBunkers();
    this.enemyManager.createFormation();

    this.state = GameState.PLAYING;
    this.soundManager.resume();

    // Start battle music when game begins
    if (this.musicManager) {
      this.musicManager.fadeToTrack('battle');
      this.currentMusicTrack = 'battle';
    }
  }

  /**
   * Start the next level (classic mode)
   */
  startNextLevel() {
    this.level++;
    this.projectileManager.clear();
    this.powerUpManager.clearPowerUps(); // Clear uncollected power-ups (keep active effects)
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

    // Resume battle music after level complete
    if (this.musicManager) {
      this.musicManager.playTrack('battle');
      this.currentMusicTrack = 'battle';
    }
  }

  /**
   * Start the next wave (endless mode)
   */
  startNextWave() {
    this.wave++;
    this.projectileManager.clear();
    this.powerUpManager.clearPowerUps(); // Clear uncollected power-ups (keep active effects)
    this.explosions = [];
    this.mysteryShip = null;
    this.mysteryShipTimer = 0;
    this.levelTransitionTimer = 0;

    // Update wave in managers
    this.enemyManager.setWave(this.wave);
    this.scoreManager.setWave(this.wave);

    // Recreate bunkers every 5 waves in endless mode
    if (this.wave % 5 === 1) {
      this.createBunkers();
    }

    this.enemyManager.createFormation();
    this.state = GameState.PLAYING;

    // Resume appropriate music after wave complete (battle or boss based on wave)
    if (this.musicManager) {
      const shouldPlayBoss = this.wave >= MUSIC.BOSS_WAVE_THRESHOLD;
      const track = shouldPlayBoss ? 'boss' : 'battle';
      this.musicManager.playTrack(track);
      this.currentMusicTrack = track;
    }
  }

  /**
   * Handle level completion
   */
  levelComplete() {
    this.state = GameState.LEVEL_COMPLETE;
    this.levelTransitionTimer = 0;
    this.soundManager.playLevelComplete();

    // Play victory jingle (one-shot) - will return to battle music when next level starts
    if (this.musicManager) {
      this.musicManager.playTrack('victory');
      this.currentMusicTrack = 'victory';
    }
  }

  /**
   * Handle game over
   */
  gameOver() {
    // Update level/wave in score manager for high score tracking
    if (this.gameMode === GameMode.ENDLESS) {
      this.scoreManager.setWave(this.wave);
    } else {
      this.scoreManager.setLevel(this.level);
    }

    // Check if player achieved a high score
    if (this.scoreManager.isHighScore()) {
      // Show name entry screen
      this.nameEntryManager.reset();
      this.newHighScoreRank = this.scoreManager.getScoreRank();
      this.state = GameState.NAME_ENTRY;
      this.soundManager.playPowerUp(); // Play celebratory sound
      // Stop music during name entry (let player focus)
      if (this.musicManager) {
        this.musicManager.stopTrack();
        this.currentMusicTrack = null;
      }
    } else {
      // Regular game over
      this.state = GameState.GAME_OVER;
      this.soundManager.playGameOver();
      // Play game over music
      if (this.musicManager) {
        this.musicManager.playTrack('gameOver');
        this.currentMusicTrack = 'gameOver';
      }
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
    let minInterval = MYSTERY_SHIP.MIN_INTERVAL;
    let maxInterval = MYSTERY_SHIP.MAX_INTERVAL;

    // In endless mode, decrease interval based on wave
    if (this.gameMode === GameMode.ENDLESS) {
      const intervalMultiplier = Math.max(
        1 - (this.wave - 1) * ENDLESS_MODE.MYSTERY_SHIP_INTERVAL_DECREASE,
        ENDLESS_MODE.MIN_MYSTERY_SHIP_INTERVAL / MYSTERY_SHIP.MIN_INTERVAL
      );
      minInterval = Math.max(ENDLESS_MODE.MIN_MYSTERY_SHIP_INTERVAL, minInterval * intervalMultiplier);
      maxInterval = Math.max(ENDLESS_MODE.MIN_MYSTERY_SHIP_INTERVAL + 2000, maxInterval * intervalMultiplier);
    }

    return randomInt(minInterval, maxInterval);
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
        this.renderer.drawStartScreenWithScores(controllerStatus, highScores, this.gameMode);
        this.drawTouchControls(ctx);
        break;

      case GameState.MODE_SELECT:
        // Draw starfield background, then mode select screen
        this.renderer.clear();
        this.starfield.draw(ctx);
        this.renderer.drawModeSelectScreen(controllerStatus, this.selectedModeIndex);
        this.drawTouchControls(ctx);
        break;

      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.LEVEL_COMPLETE:
        this.renderGame();

        if (this.state === GameState.PAUSED) {
          this.renderer.drawPause(hasController);
        } else if (this.state === GameState.LEVEL_COMPLETE) {
          if (this.gameMode === GameMode.ENDLESS) {
            const speedMultiplier = this.enemyManager.getDifficultyMultiplier();
            this.renderer.drawWaveComplete(this.wave, speedMultiplier);
          } else {
            this.renderer.drawLevelComplete(this.level);
          }
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
        this.drawTouchControls(ctx);
        break;
    }
  }

  /**
   * Draw touch controls overlay (only on touch devices)
   * @param {CanvasRenderingContext2D} ctx
   */
  drawTouchControls(ctx) {
    if (this.input.isTouchActive()) {
      const buttonPositions = this.input.getTouchButtonPositions();
      const buttonStates = this.input.getTouchButtonStates();
      this.touchControlsRenderer.draw(ctx, buttonPositions, buttonStates);
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

    // Draw power-ups
    this.powerUpManager.draw(ctx);

    // Draw player
    this.player.draw(ctx);

    // Draw projectiles
    this.projectileManager.draw(ctx);

    // Draw explosions
    for (const exp of this.explosions) {
      this.renderer.drawExplosion(exp.x, exp.y, exp.frame);
    }

    // Draw HUD with controller status (different for classic vs endless mode)
    const controllerStatus = this.input.getControllerStatus();
    if (this.gameMode === GameMode.ENDLESS) {
      this.renderer.drawHUDEndless(
        this.scoreManager.getScore(),
        this.scoreManager.getHighScore(),
        this.player.lives,
        this.wave,
        controllerStatus
      );
    } else {
      this.renderer.drawHUD(
        this.scoreManager.getScore(),
        this.scoreManager.getHighScore(),
        this.player.lives,
        this.level,
        controllerStatus
      );
    }

    // Draw power-up HUD (active effects with countdown timers)
    const activeEffects = this.powerUpManager.getActiveEffectsStatus(this.lastTime);
    this.renderer.drawPowerUpHUD(activeEffects);

    // Draw touch controls overlay (on touch devices)
    this.drawTouchControls(ctx);
  }
}
