/**
 * Auto-Configuration Module
 * Automatically detects screen size, game area, cell size, and colors
 * Makes bot device-agnostic - works on any Android device
 */

const { log } = require('./debug.js');

const autoConfig = {
  /**
   * Automatically detect all configuration from a screenshot
   * @param {Image} img - Captured screen image
   * @returns {Object} Detected configuration
   */
  detectConfiguration(img) {
    log('info', 'Starting auto-configuration...');

    const config = {
      screenWidth: img.getWidth(),
      screenHeight: img.getHeight(),
      gameArea: {},
      cellSize: 0,
      colors: {}
    };

    log('info', `Screen size: ${config.screenWidth}x${config.screenHeight}`);

    // Detect game area boundaries
    config.gameArea = this.detectGameArea(img);

    // Detect cell size from grid pattern
    config.cellSize = this.detectCellSize(img, config.gameArea);

    // Sample colors from actual cells
    config.colors = this.sampleColors(img, config.gameArea, config.cellSize);

    log('info', 'Auto-configuration complete!');
    log('info', `Game area: ${JSON.stringify(config.gameArea)}`);
    log('info', `Cell size: ${config.cellSize}px`);

    return config;
  },

  /**
   * Detect game area by finding where UI ends and grid begins
   * @param {Image} img - Captured image
   * @returns {Object} {top, bottom, left, right}
   */
  detectGameArea(img) {
    const width = img.getWidth();
    const height = img.getHeight();

    // Find top boundary (where grid starts)
    let top = 100;
    for (let y = 50; y < 400; y += 10) {
      let gameContentCount = 0;

      // Sample across the width
      for (let x = 50; x < width - 50; x += 50) {
        const color = images.pixel(img, x, y);
        const r = colors.red(color);
        const g = colors.green(color);
        const b = colors.blue(color);

        // Look for game cell colors (gray unrevealed or blue revealed)
        // Gray: high RGB values, similar R/G/B
        // Blue: high B, medium-high R/G
        if ((r > 150 && g > 150 && b > 150) || // Gray cells
            (b > 150 && r > 100 && r < 200)) {  // Blue cells
          gameContentCount++;
        }
      }

      // If we find game content across multiple columns, this is the top
      if (gameContentCount >= 3) {
        top = y;
        break;
      }
    }

    // Find bottom boundary
    let bottom = height - 50;
    for (let y = height - 50; y > height - 400; y -= 10) {
      let gameContentCount = 0;

      for (let x = 50; x < width - 50; x += 50) {
        const color = images.pixel(img, x, y);
        const r = colors.red(color);
        const g = colors.green(color);
        const b = colors.blue(color);

        if ((r > 150 && g > 150 && b > 150) || (b > 150 && r > 100 && r < 200)) {
          gameContentCount++;
        }
      }

      if (gameContentCount >= 3) {
        bottom = y;
        break;
      }
    }

    // Most infinite minesweeper games use full width
    const left = 0;
    const right = width;

    log('debug', `Detected game area: top=${top}, bottom=${bottom}, left=${left}, right=${right}`);

    return { top, bottom, left, right };
  },

  /**
   * Detect cell size by finding grid line patterns
   * @param {Image} img - Captured image
   * @param {Object} gameArea - Detected game area
   * @returns {number} Cell size in pixels
   */
  detectCellSize(img, gameArea) {
    const midY = Math.floor((gameArea.top + gameArea.bottom) / 2);
    const verticalLines = [];

    // Scan horizontally to find vertical grid lines
    // Grid lines are typically pink/magenta or dark
    for (let x = gameArea.left + 10; x < Math.min(gameArea.left + 600, gameArea.right); x++) {
      const color = images.pixel(img, x, midY);
      const r = colors.red(color);
      const g = colors.green(color);
      const b = colors.blue(color);

      // Detect pink/magenta grid lines (high R, low G, high B)
      // Or dark grid lines (all low RGB)
      const isPinkLine = (r > 200 && g < 100 && b > 100);
      const isDarkLine = (r < 80 && g < 80 && b < 80);

      if (isPinkLine || isDarkLine) {
        verticalLines.push(x);
      }
    }

    // Group nearby detections (same line detected multiple times)
    const uniqueLines = [];
    if (verticalLines.length > 0) {
      uniqueLines.push(verticalLines[0]);

      for (const line of verticalLines) {
        const lastLine = uniqueLines[uniqueLines.length - 1];
        if (line - lastLine > 20) { // At least 20px apart = different line
          uniqueLines.push(line);
        }
      }
    }

    // Calculate cell size from line spacing
    let cellSize = 100; // Default fallback

    if (uniqueLines.length >= 2) {
      // Calculate average spacing
      const spacings = [];
      for (let i = 1; i < Math.min(uniqueLines.length, 5); i++) {
        spacings.push(uniqueLines[i] - uniqueLines[i - 1]);
      }

      // Use median spacing (more robust than average)
      spacings.sort((a, b) => a - b);
      cellSize = spacings[Math.floor(spacings.length / 2)];

      log('debug', `Detected ${uniqueLines.length} grid lines, cell size: ${cellSize}px`);
    } else {
      // Fallback: estimate from screen size
      // Most games have 4-8 columns visible
      const gameWidth = gameArea.right - gameArea.left;
      cellSize = Math.floor(gameWidth / 5); // Assume ~5 columns

      log('warn', `Could not detect grid lines, estimating cell size: ${cellSize}px`);
    }

    return cellSize;
  },

  /**
   * Sample colors from actual game cells
   * @param {Image} img - Captured image
   * @param {Object} gameArea - Game area boundaries
   * @param {number} cellSize - Detected cell size
   * @returns {Object} Color configuration
   */
  sampleColors(img, gameArea, cellSize) {
    const colorConfig = {
      covered: "#CCCCCC",
      coveredThreshold: 30,
      revealed: "#A0C8E8",
      revealedThreshold: 30,
      flag: "#E91E63",
      flagThreshold: 40,
      mine: "#000000",
      mineThreshold: 30
    };

    // Sample multiple regions to find different cell types
    const samples = [];
    const sampleCount = 20;

    for (let i = 0; i < sampleCount; i++) {
      const x = gameArea.left + Math.floor(Math.random() * (gameArea.right - gameArea.left));
      const y = gameArea.top + Math.floor(Math.random() * (gameArea.bottom - gameArea.top));

      const color = images.pixel(img, x, y);
      const r = colors.red(color);
      const g = colors.green(color);
      const b = colors.blue(color);

      samples.push({ x, y, r, g, b, color });
    }

    // Categorize sampled colors
    let unrevealed = null;
    let revealed = null;
    let flag = null;

    for (const sample of samples) {
      const { r, g, b, color } = sample;

      // Unrevealed cells: gray (high RGB, similar values)
      if (r > 200 && g > 200 && b > 200 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
        if (!unrevealed) {
          unrevealed = colors.toString(color);
          log('debug', `Sampled unrevealed cell color: ${unrevealed}`);
        }
      }

      // Revealed cells: blue-ish (high B, medium R/G)
      if (b > 150 && r > 80 && r < 200 && g > 80 && g < 200) {
        if (!revealed) {
          revealed = colors.toString(color);
          log('debug', `Sampled revealed cell color: ${revealed}`);
        }
      }

      // Flags: pink/magenta (high R, low G, high B)
      if (r > 200 && g < 150 && b > 150) {
        if (!flag) {
          flag = colors.toString(color);
          log('debug', `Sampled flag color: ${flag}`);
        }
      }
    }

    // Update config with sampled colors
    if (unrevealed) colorConfig.covered = unrevealed;
    if (revealed) colorConfig.revealed = revealed;
    if (flag) colorConfig.flag = flag;

    return colorConfig;
  },

  /**
   * Refine color detection during gameplay
   * Call this after revealing several cells to improve accuracy
   * @param {Image} img - Current screenshot
   * @param {Array} knownCells - Array of {x, y, state} for cells with known states
   */
  refineColors(img, knownCells) {
    // TODO: Use machine learning or clustering to refine colors
    // based on cells with known states from gameplay
    log('debug', 'Color refinement not yet implemented');
  }
};

module.exports = autoConfig;
