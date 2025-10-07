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
   * Detect number in a revealed cell using OCR or pattern matching
   * @param {Image} img - Captured image
   * @param {number} x - Cell center x
   * @param {number} y - Cell center y
   * @returns {number} Number 0-8 (0 = empty, 1-8 = mine count)
   */
  detectNumberInCell(img, x, y) {
    const cellSize = config.cellSize || 80;
    const halfSize = Math.floor(cellSize / 2);

    // Extract cell region
    const cellImg = images.clip(img, x - halfSize, y - halfSize, cellSize, cellSize);

    // Try AutoX.js built-in OCR if available
    if (typeof paddle !== 'undefined' && paddle.ocrText) {
      try {
        const text = paddle.ocrText(cellImg);
        images.recycle(cellImg);

        // Parse single digit
        const digit = parseInt(text.trim());
        if (!isNaN(digit) && digit >= 0 && digit <= 8) {
          return digit;
        }
      } catch (e) {
        log('debug', `OCR failed: ${e.message}`);
      }
    }

    // Fallback: Advanced pattern-based detection
    const number = this.detectNumberByPattern(cellImg, x, y);
    images.recycle(cellImg);
    return number;
  },

  /**
   * Detect number by analyzing white pixel patterns
   * @param {Image} cellImg - Clipped cell image
   * @param {number} centerX - Original center X
   * @param {number} centerY - Original center Y
   * @returns {number} Detected number 0-8
   */
  detectNumberByPattern(cellImg, centerX, centerY) {
    const width = cellImg.getWidth();
    const height = cellImg.getHeight();

    // Analyze white pixel distribution in different regions
    const centerX_local = Math.floor(width / 2);
    const centerY_local = Math.floor(height / 2);
    const radius = Math.floor(Math.min(width, height) / 3);

    // Count white pixels in 9 zones (3x3 grid)
    const zones = {
      topLeft: 0, top: 0, topRight: 0,
      left: 0, center: 0, right: 0,
      bottomLeft: 0, bottom: 0, bottomRight: 0
    };

    let totalWhite = 0;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const color = images.pixel(cellImg, x, y);
        const r = colors.red(color);
        const g = colors.green(color);
        const b = colors.blue(color);

        // White text detection (high RGB, not blue background)
        const isWhite = (r > 200 && g > 200 && b > 200);

        if (isWhite) {
          totalWhite++;

          // Classify into zones
          const dx = x - centerX_local;
          const dy = y - centerY_local;

          if (dy < -radius / 2) {
            if (dx < -radius / 2) zones.topLeft++;
            else if (dx > radius / 2) zones.topRight++;
            else zones.top++;
          } else if (dy > radius / 2) {
            if (dx < -radius / 2) zones.bottomLeft++;
            else if (dx > radius / 2) zones.bottomRight++;
            else zones.bottom++;
          } else {
            if (dx < -radius / 2) zones.left++;
            else if (dx > radius / 2) zones.right++;
            else zones.center++;
          }
        }
      }
    }

    // Pattern recognition based on white pixel distribution
    if (totalWhite < 5) {
      return 0; // Empty cell
    }

    // Number 1: Strong center/top vertical line
    if (zones.center > totalWhite * 0.5 && zones.top > totalWhite * 0.2) {
      return 1;
    }

    // Number 2: Top, center, and bottom distributed
    if (zones.top > 3 && zones.bottom > 3 && zones.center > 2) {
      return 2;
    }

    // Number 3: Strong right side, top and bottom
    if (zones.right > totalWhite * 0.3 && zones.top > 2 && zones.bottom > 2) {
      return 3;
    }

    // Number 4: Strong right side with center
    if (zones.right > totalWhite * 0.35 && zones.left > 2 && zones.center > 3) {
      return 4;
    }

    // Number 5: Similar to 2 but different pattern
    if (zones.top > 3 && zones.bottom > 3 && zones.left > 2) {
      return 5;
    }

    // Number 6: Strong left and bottom
    if (zones.left > totalWhite * 0.3 && zones.bottom > totalWhite * 0.3) {
      return 6;
    }

    // Number 7: Strong top, weak bottom
    if (zones.top > totalWhite * 0.4 && zones.bottom < totalWhite * 0.15) {
      return 7;
    }

    // Number 8: Distributed across all zones (most white pixels)
    if (totalWhite > 45) {
      return 8;
    }

    // Fallback: Use total white pixel count as rough estimate
    if (totalWhite < 15) return 1;
    if (totalWhite < 22) return 2;
    if (totalWhite < 28) return 3;
    if (totalWhite < 34) return 4;
    if (totalWhite < 40) return 5;
    if (totalWhite < 46) return 6;
    if (totalWhite < 52) return 7;
    return 8;
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
