/**
 * Minesweeper Bot - Main Entry Point
 * AutoX.js automation for infinite Minesweeper games
 *
 * Usage:
 * 1. Open Minesweeper game on Android
 * 2. Tap AutoX.js floating button
 * 3. Run this script
 * 4. Bot will play automatically
 *
 * Press volume down button to stop the bot
 */

"ui";

// Import modules
const config = require('./config.js');
const autoConfig = require('./auto_config.js');
const vision = require('./vision.js');
const grid = require('./grid.js');
const solver = require('./solver.js');
const actions = require('./actions.js');
const debug = require('./debug.js');

// ===== MAIN BOT CLASS =====

class MinesweeperBot {
  constructor() {
    this.running = false;
    this.stats = {
      moves: 0,
      revealed: 0,
      flags: 0,
      startTime: null,
      timeElapsed: 0
    };
  }

  /**
   * Initialize the bot
   */
  init() {
    debug.init();
    debug.toast('Minesweeper Bot Starting...');

    // Request screen capture permission
    vision.requestPermission();

    // Wait for user to switch to game
    debug.toast('Switch to Minesweeper game in 3 seconds...');
    sleep(3000);

    // Initial screen capture for auto-configuration
    debug.log('info', 'Capturing initial screen for auto-configuration...');
    const img = vision.captureScreen();

    if (!img) {
      debug.toast('Failed to capture screen');
      exit();
    }

    // Auto-detect configuration from screenshot
    debug.toast('Auto-detecting configuration...');
    const detectedConfig = autoConfig.detectConfiguration(img);

    // Merge detected config with manual config (manual overrides auto)
    // This allows users to override specific values if needed
    config.screenWidth = config.screenWidth || detectedConfig.screenWidth;
    config.screenHeight = config.screenHeight || detectedConfig.screenHeight;

    // Only override gameArea if not manually set (check if default values)
    if (!config.gameAreaManual) {
      config.gameArea = detectedConfig.gameArea;
    }

    // Only override cellSize if not manually set or is default
    if (config.cellSize === 80 || !config.cellSize) {
      config.cellSize = detectedConfig.cellSize;
    }

    // Merge colors (auto-detected colors override defaults)
    config.colors = Object.assign({}, config.colors, detectedConfig.colors);

    debug.log('info', 'Final configuration:');
    debug.log('info', `  Screen: ${config.screenWidth}x${config.screenHeight}`);
    debug.log('info', `  Game area: ${JSON.stringify(config.gameArea)}`);
    debug.log('info', `  Cell size: ${config.cellSize}px`);

    // Detect and initialize grid
    grid.detectGrid(img);
    grid.initializeGrid(img);
    images.recycle(img);

    debug.toast('Bot initialized! Starting in 2s...');
    sleep(2000);

    this.stats.startTime = Date.now();
  }

  /**
   * Main game loop
   */
  async run() {
    this.running = true;
    let iterationsWithoutProgress = 0;
    let lastRevealedCount = 0;

    debug.log('info', '=== Starting Main Loop ===');

    while (this.running) {
      try {
        // Capture current screen
        const img = vision.captureScreen();
        if (!img) {
          debug.log('error', 'Screen capture failed');
          sleep(1000);
          continue;
        }

        // Update grid state from screen
        grid.scanGrid(img);

        // Save debug screenshot if configured
        if (config.debug.saveScreenshots) {
          debug.saveScreenshot(img, `frame_${this.stats.moves}.png`);
        }

        images.recycle(img);

        // Get current stats
        const gridStats = grid.getStats();
        debug.log('debug', `Grid: ${gridStats.revealed} revealed, ${gridStats.flags} flags, ${gridStats.covered} covered`);

        // Check for progress
        if (gridStats.revealed === lastRevealedCount) {
          iterationsWithoutProgress++;
        } else {
          iterationsWithoutProgress = 0;
          lastRevealedCount = gridStats.revealed;
        }

        // If no progress for multiple iterations, might be stuck
        if (iterationsWithoutProgress > 5) {
          debug.log('warn', 'No progress detected, attempting recovery...');

          // Try scrolling to reveal more cells
          if (config.scroll.enabled) {
            actions.scroll();
            iterationsWithoutProgress = 0;
            continue;
          }
        }

        // Get next move from solver
        const move = solver.getNextMove();

        if (!move) {
          debug.log('warn', 'No moves available');

          // Check if solved
          if (solver.isSolved()) {
            debug.toast('Grid solved!');
            debug.log('info', '✓ Grid appears to be solved');

            // Scroll to continue infinite game
            if (config.scroll.enabled) {
              debug.log('info', 'Scrolling to continue...');
              actions.scroll();
              sleep(1000);
              continue;
            } else {
              // Stop if no scrolling
              break;
            }
          }

          // Try scrolling if stuck
          if (config.scroll.enabled) {
            actions.scroll();
            sleep(1000);
            continue;
          }

          // No moves and can't scroll - give up
          debug.log('error', 'Stuck: no moves and cannot scroll');
          break;
        }

        // Execute the move
        debug.log('info', `Move ${this.stats.moves + 1}: ${move.action} at (${move.row}, ${move.col}) - ${move.reason}`);

        const coords = grid.cellToScreen(move.row, move.col);
        if (!coords) {
          debug.log('error', 'Invalid cell coordinates');
          continue;
        }

        // Perform action
        if (move.action === 'reveal') {
          actions.revealCell(coords.x, coords.y);
          this.stats.revealed++;
        } else if (move.action === 'flag') {
          actions.placeFlag(coords.x, coords.y);
          this.stats.flags++;
        }

        this.stats.moves++;

        // Update elapsed time
        this.stats.timeElapsed = Math.floor((Date.now() - this.stats.startTime) / 1000);

        // Show stats periodically
        if (this.stats.moves % 10 === 0) {
          debug.showStats(this.stats);
        }

        // Wait between moves
        sleep(config.delays.betweenMoves);

        // Check if should scroll (based on progress)
        if (config.scroll.enabled) {
          const revealedPercent = gridStats.revealed / gridStats.total;
          if (revealedPercent >= config.scroll.whenToScroll) {
            debug.log('info', `${(revealedPercent * 100).toFixed(0)}% revealed, scrolling...`);
            actions.scroll();
            sleep(1000);
          }
        }

      } catch (e) {
        debug.log('error', `Loop error: ${e.message}`);
        debug.log('error', e.stack);
        sleep(1000);
      }
    }

    this.cleanup();
  }

  /**
   * Stop the bot
   */
  stop() {
    debug.log('info', 'Stopping bot...');
    this.running = false;
  }

  /**
   * Cleanup and show final stats
   */
  cleanup() {
    debug.log('info', '=== Bot Stopped ===');
    debug.showStats(this.stats);
    debug.cleanup();
    debug.toast('Bot stopped');
  }
}

// ===== ENTRY POINT =====

function main() {
  // Show welcome message
  console.clear();
  console.log('========================================');
  console.log('   Minesweeper Bot for AutoX.js');
  console.log('========================================');
  console.log('');
  console.log('Controls:');
  console.log('  - Volume Down: Stop bot');
  console.log('');
  console.log('Make sure:');
  console.log('  1. Minesweeper game is ready');
  console.log('  2. config.js is tuned for your device');
  console.log('  3. Bot has screen capture permission');
  console.log('');
  console.log('========================================');
  console.log('');

  // Create bot instance
  const bot = new MinesweeperBot();

  // Set up volume down to stop
  events.observeKey();
  events.onKeyDown('volume_down', () => {
    debug.log('info', 'Volume Down pressed - stopping bot');
    bot.stop();
    exit();
  });

  // Initialize and run
  try {
    bot.init();
    bot.run();
  } catch (e) {
    console.error('Fatal error:', e.message);
    console.error(e.stack);
    debug.toast('Bot crashed: ' + e.message);
  }
}

// Run main function
main();
