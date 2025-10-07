/**
 * Vision Module
 * Screen capture, color detection, and cell recognition
 */

const config = require('./config.js');
const { log } = require('./debug.js');

const vision = {
  /**
   * Request screen capture permission (call once at start)
   */
  requestPermission() {
    if (!requestScreenCapture()) {
      log('error', 'Screen capture permission denied');
      toast('Please grant screen capture permission');
      exit();
    }
    log('info', 'Screen capture permission granted');
  },

  /**
   * Capture current screen
   * @returns {Image} Captured image
   */
  captureScreen() {
    const img = captureScreen();
    if (!img) {
      log('error', 'Failed to capture screen');
      return null;
    }
    return img;
  },

  /**
   * Get pixel color at specific coordinate
   * @param {Image} img - Captured image
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Color as integer
   */
  getPixelColor(img, x, y) {
    return images.pixel(img, x, y);
  },

  /**
   * Compare two colors within threshold
   * @param {number} color1 - First color (integer)
   * @param {number} color2 - Second color (integer or hex string)
   * @param {number} threshold - Tolerance (0-255)
   * @returns {boolean} True if colors match
   */
  colorsMatch(color1, color2, threshold = 30) {
    // Convert hex string to integer if needed
    if (typeof color2 === 'string') {
      color2 = colors.parseColor(color2);
    }

    const r1 = colors.red(color1);
    const g1 = colors.green(color1);
    const b1 = colors.blue(color1);

    const r2 = colors.red(color2);
    const g2 = colors.green(color2);
    const b2 = colors.blue(color2);

    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    return diff <= threshold * 3;
  },

  /**
   * Detect cell state from color and pattern
   * @param {Image} img - Captured image
   * @param {number} x - Cell center x coordinate
   * @param {number} y - Cell center y coordinate
   * @returns {string|number} Cell state: "covered", "revealed", "flag", "mine", or number 0-8
   */
  detectCellState(img, x, y) {
    const color = this.getPixelColor(img, x, y);

    // Check for flag
    if (this.colorsMatch(color, config.colors.flag, config.colors.flagThreshold)) {
      return 'flag';
    }

    // Check for mine (usually after game over)
    if (this.colorsMatch(color, config.colors.mine, config.colors.mineThreshold)) {
      return 'mine';
    }

    // Check for covered cell (gray)
    if (this.colorsMatch(color, config.colors.covered, config.colors.coveredThreshold)) {
      return 'covered';
    }

    // Check if revealed (blue background)
    const r = colors.red(color);
    const g = colors.green(color);
    const b = colors.blue(color);

    // Blue revealed cell detection: blue is dominant
    const isBlueish = (b > 150 && r > 80 && r < 220 && g > 80 && g < 220);

    if (isBlueish || this.colorsMatch(color, config.colors.revealed, config.colors.revealedThreshold)) {
      // Cell is revealed - now detect the number
      // Count white pixels in a small region around center (numbers are white text)
      const number = this.detectNumberInCell(img, x, y);
      return number; // Returns 0-8
    }

    // Default: assume covered if unclear
    log('debug', `Unknown cell state at (${x}, ${y}), color: RGB(${r},${g},${b})`);
    return 'covered';
  },

  /**
   * Detect number in a revealed cell by analyzing white pixels
   * @param {Image} img - Captured image
   * @param {number} x - Cell center x
   * @param {number} y - Cell center y
   * @returns {number} Number 0-8 (0 = empty, 1-8 = mine count)
   */
  detectNumberInCell(img, x, y) {
    // Sample a small region around the center for white pixels (text)
    const sampleRadius = 15; // pixels around center
    let whitePixelCount = 0;

    for (let dy = -sampleRadius; dy <= sampleRadius; dy += 3) {
      for (let dx = -sampleRadius; dx <= sampleRadius; dx += 3) {
        const px = x + dx;
        const py = y + dy;

        if (px >= 0 && py >= 0) {
          const pixelColor = this.getPixelColor(img, px, py);
          const r = colors.red(pixelColor);
          const g = colors.green(pixelColor);
          const b = colors.blue(pixelColor);

          // White text detection (high RGB values)
          if (r > 200 && g > 200 && b > 200) {
            whitePixelCount++;
          }
        }
      }
    }

    // Heuristic: more white pixels = higher number
    // This is approximate - actual OCR would be better
    if (whitePixelCount < 3) return 0; // Empty (no number)
    if (whitePixelCount < 8) return 1;
    if (whitePixelCount < 12) return 2;
    if (whitePixelCount < 16) return 3;
    if (whitePixelCount < 20) return 4;
    if (whitePixelCount < 24) return 5;
    if (whitePixelCount < 28) return 6;
    if (whitePixelCount < 32) return 7;
    return 8;

    // TODO: Replace with proper OCR for accuracy
    // This pixel-counting heuristic is a placeholder
  },

  /**
   * Find color on screen
   * @param {Image} img - Captured image
   * @param {string} color - Hex color to find
   * @param {Object} options - Search options {threshold, region}
   * @returns {Object|null} {x, y} or null if not found
   */
  findColor(img, color, options = {}) {
    const threshold = options.threshold || 30;
    const region = options.region || config.gameArea;

    const point = images.findColor(img, color, {
      region: [region.left, region.top, region.right - region.left, region.bottom - region.top],
      threshold: threshold
    });

    return point;
  },

  /**
   * Find multiple colors (returns all matches)
   * @param {Image} img - Captured image
   * @param {string} color - Hex color to find
   * @param {Object} options - Search options
   * @returns {Array<{x, y}>} Array of matching points
   */
  findAllColors(img, color, options = {}) {
    const results = [];
    const threshold = options.threshold || 30;
    const region = options.region || config.gameArea;

    // This is a simplified version - AutoX.js may have better APIs for this
    const width = region.right - region.left;
    const height = region.bottom - region.top;

    // Sample every N pixels to avoid full scan
    const step = Math.floor(config.cellSize / 2);

    for (let y = region.top; y < region.bottom; y += step) {
      for (let x = region.left; x < region.right; x += step) {
        const pixelColor = this.getPixelColor(img, x, y);
        if (this.colorsMatch(pixelColor, color, threshold)) {
          results.push({ x, y });
        }
      }
    }

    return results;
  },

  /**
   * Detect grid lines by scanning for repeating patterns
   * @param {Image} img - Captured image
   * @returns {Object} {horizontalLines: Array, verticalLines: Array}
   */
  detectGridLines(img) {
    const { gameArea } = config;
    const horizontalLines = [];
    const verticalLines = [];

    // Scan for vertical lines (cell boundaries)
    for (let x = gameArea.left; x < gameArea.right; x += 5) {
      let lineScore = 0;
      for (let y = gameArea.top; y < gameArea.bottom; y += 10) {
        const color = this.getPixelColor(img, x, y);
        // Look for consistent dark/border colors
        if (colors.red(color) < 100 && colors.green(color) < 100 && colors.blue(color) < 100) {
          lineScore++;
        }
      }
      if (lineScore > 10) { // Threshold for detecting a line
        verticalLines.push(x);
        x += config.cellSize - 10; // Skip to next expected line
      }
    }

    // Scan for horizontal lines
    for (let y = gameArea.top; y < gameArea.bottom; y += 5) {
      let lineScore = 0;
      for (let x = gameArea.left; x < gameArea.right; x += 10) {
        const color = this.getPixelColor(img, x, y);
        if (colors.red(color) < 100 && colors.green(color) < 100 && colors.blue(color) < 100) {
          lineScore++;
        }
      }
      if (lineScore > 10) {
        horizontalLines.push(y);
        y += config.cellSize - 10;
      }
    }

    log('debug', `Detected ${verticalLines.length} vertical, ${horizontalLines.length} horizontal lines`);
    return { horizontalLines, verticalLines };
  },

  /**
   * Use OCR to recognize numbers in cells (optional, requires OCR plugin)
   * @param {Image} img - Captured image
   * @param {number} x - Cell x coordinate
   * @param {number} y - Cell y coordinate
   * @param {number} size - Cell size
   * @returns {string|null} Recognized text or null
   */
  ocrCell(img, x, y, size) {
    try {
      // Clip cell region
      const cellImg = images.clip(img, x - size/2, y - size/2, size, size);

      // Use OCR (requires PaddleOCR plugin or similar)
      // This is a placeholder - actual implementation depends on available OCR module
      // const text = paddle.ocr(cellImg);

      images.recycle(cellImg);
      // return text;

      log('debug', 'OCR not implemented yet');
      return null;
    } catch (e) {
      log('error', `OCR failed: ${e.message}`);
      return null;
    }
  },

  /**
   * Convert color to hex string for logging
   * @param {number} color - Color integer
   * @returns {string} Hex color string
   */
  colorToHex(color) {
    return colors.toString(color);
  }
};

module.exports = vision;
