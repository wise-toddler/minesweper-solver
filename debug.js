/**
 * Debug and Logging Module
 * Visualization overlays and logging utilities
 */

const config = require('./config.js');

const debug = {
  // Log level priorities
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },

  /**
   * Log a message to console
   * @param {string} level - Log level: "debug", "info", "warn", "error"
   * @param {string} message - Message to log
   */
  log(level, message) {
    if (!config.debug.enabled) return;

    const currentLevel = this.levels[config.debug.logLevel] || 0;
    const messageLevel = this.levels[level] || 0;

    if (messageLevel >= currentLevel) {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      console.log(`${prefix} ${message}`);
    }
  },

  /**
   * Show a toast message on screen
   * @param {string} message - Message to display
   */
  toast(message) {
    if (config.debug.enabled) {
      toast(message);
    }
  },

  /**
   * Draw grid overlay on screen (requires canvas module)
   * @param {Array<Array>} grid - 2D array of cell states
   * @param {Object} gridInfo - Grid detection info {cellSize, offsetX, offsetY, rows, cols}
   */
  drawGridOverlay(grid, gridInfo) {
    if (!config.debug.showOverlay) return;

    try {
      // Note: Overlay drawing requires floaty module
      // This is a placeholder for the overlay logic
      // You'll need to use floaty.window() to create persistent overlay

      const { cellSize, offsetX, offsetY, rows, cols } = gridInfo;

      // Draw grid lines
      for (let row = 0; row <= rows; row++) {
        // Horizontal lines (placeholder)
      }

      for (let col = 0; col <= cols; col++) {
        // Vertical lines (placeholder)
      }

      // Draw cell states with colors
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = grid[row][col];
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;

          // Color code: green=revealed, red=mine, blue=flag, gray=unrevealed
          // (This requires canvas drawing implementation)
        }
      }
    } catch (e) {
      this.log('error', `Failed to draw overlay: ${e.message}`);
    }
  },

  /**
   * Save a screenshot to storage
   * @param {Image} img - Captured image
   * @param {string} filename - Filename (without path)
   */
  saveScreenshot(img, filename) {
    if (!config.debug.saveScreenshots) return;

    try {
      const path = config.debug.screenshotPath + filename;
      files.ensureDir(config.debug.screenshotPath);
      images.save(img, path);
      this.log('debug', `Screenshot saved: ${path}`);
    } catch (e) {
      this.log('error', `Failed to save screenshot: ${e.message}`);
    }
  },

  /**
   * Display statistics overlay
   * @param {Object} stats - Statistics object
   */
  showStats(stats) {
    const message = `
Cells Revealed: ${stats.revealed || 0}
Flags Placed: ${stats.flags || 0}
Moves Made: ${stats.moves || 0}
Time Elapsed: ${stats.timeElapsed || 0}s
    `.trim();

    this.log('info', message);
  },

  /**
   * Draw a rectangle on screen (for debugging cell detection)
   * @param {number} x - Top-left x
   * @param {number} y - Top-left y
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {string} color - Color (hex)
   */
  drawRect(x, y, width, height, color = "#FF0000") {
    if (!config.debug.showOverlay) return;

    // This requires floaty window implementation
    // Placeholder for actual drawing logic
    this.log('debug', `Drawing rect at (${x}, ${y}) ${width}x${height}`);
  },

  /**
   * Initialize debug environment
   */
  init() {
    if (!config.debug.enabled) return;

    this.log('info', '=== Minesweeper Bot Started ===');
    this.log('info', `Screen: ${config.screenWidth}x${config.screenHeight}`);
    this.log('info', `Game Area: ${JSON.stringify(config.gameArea)}`);
    this.log('info', `Debug Mode: ${config.debug.showOverlay ? 'Overlay ON' : 'Overlay OFF'}`);

    // Create screenshot directory if needed
    if (config.debug.saveScreenshots) {
      files.ensureDir(config.debug.screenshotPath);
    }
  },

  /**
   * Cleanup debug resources
   */
  cleanup() {
    this.log('info', '=== Minesweeper Bot Stopped ===');
  }
};

// Export both debug object and log function
module.exports = debug;
module.exports.log = debug.log.bind(debug);
