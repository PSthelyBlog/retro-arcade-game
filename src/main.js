/**
 * Retro Arcade Game - Space Invaders Clone
 * Entry point
 *
 * Scaffolded using goose with Claude Code's lead/worker pattern
 * Following AGENTS.md standard: https://agents.md/
 */

import { Game } from './game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting Retro Arcade Game...');

  try {
    const game = new Game();
    game.start();
    console.log('✅ Game initialized successfully');
  } catch (error) {
    console.error('❌ Failed to start game:', error);

    // Show error on page
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FF0000';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Error loading game', canvas.width / 2, canvas.height / 2);
      ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 30);
    }
  }
});
