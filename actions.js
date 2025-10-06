/**
 * Input Simulation Module
 * Wrappers around AutoX.js input APIs for Minesweeper actions
 */

const config = require('./config.js');
const { log } = require('./debug.js');

const actions = {
  /**
   * Reveal a cell by tapping it
   * @param {number} x - Screen x coordinate
   * @param {number} y - Screen y coordinate
   */
  revealCell(x, y) {
    log('debug', `Revealing cell at (${x}, ${y})`);
    click(x, y);
    sleep(config.delays.afterClick);
  },

  /**
   * Place or remove a flag by long-pressing
   * @param {number} x - Screen x coordinate
   * @param {number} y - Screen y coordinate
   */
  toggleFlag(x, y) {
    log('debug', `Toggling flag at (${x}, ${y})`);
    longClick(x, y, config.delays.longPress);
    sleep(config.delays.afterFlag);
  },

  /**
   * Place a flag (if not already flagged)
   * @param {number} x - Screen x coordinate
   * @param {number} y - Screen y coordinate
   */
  placeFlag(x, y) {
    log('info', `Placing flag at (${x}, ${y})`);
    this.toggleFlag(x, y);
  },

  /**
   * Remove a flag (if flagged)
   * @param {number} x - Screen x coordinate
   * @param {number} y - Screen y coordinate
   */
  removeFlag(x, y) {
    log('info', `Removing flag at (${x}, ${y})`);
    this.toggleFlag(x, y);
  },

  /**
   * Scroll the game board
   * @param {string} direction - "up", "down", "left", "right"
   * @param {number} distance - Pixels to scroll (optional)
   */
  scroll(direction = config.scroll.direction, distance = config.scroll.pixelsPerScroll) {
    const { gameArea } = config;
    const centerX = (gameArea.left + gameArea.right) / 2;
    const centerY = (gameArea.top + gameArea.bottom) / 2;

    let startX, startY, endX, endY;

    switch (direction) {
      case 'down':
        startX = centerX;
        startY = gameArea.bottom - 100;
        endX = centerX;
        endY = startY - distance;
        break;
      case 'up':
        startX = centerX;
        startY = gameArea.top + 100;
        endX = centerX;
        endY = startY + distance;
        break;
      case 'left':
        startX = gameArea.left + 100;
        startY = centerY;
        endX = startX + distance;
        endY = centerY;
        break;
      case 'right':
        startX = gameArea.right - 100;
        startY = centerY;
        endX = startX - distance;
        endY = centerY;
        break;
      default:
        log('error', `Invalid scroll direction: ${direction}`);
        return;
    }

    log('info', `Scrolling ${direction} by ${distance}px`);
    swipe(startX, startY, endX, endY, 300);
    sleep(500); // Wait for scroll animation
  },

  /**
   * Wait for a specified duration
   * @param {number} ms - Milliseconds to wait
   */
  wait(ms) {
    sleep(ms);
  },

  /**
   * Check if a coordinate is within the game area
   * @param {number} x - Screen x coordinate
   * @param {number} y - Screen y coordinate
   * @returns {boolean}
   */
  isInGameArea(x, y) {
    const { gameArea } = config;
    return x >= gameArea.left && x <= gameArea.right &&
           y >= gameArea.top && y <= gameArea.bottom;
  },

  /**
   * Perform multiple reveals in sequence
   * @param {Array<{x: number, y: number}>} cells - Array of cell coordinates
   */
  revealMultiple(cells) {
    log('info', `Revealing ${cells.length} cells`);
    for (const cell of cells) {
      this.revealCell(cell.x, cell.y);
      sleep(config.delays.betweenMoves);
    }
  },

  /**
   * Perform multiple flag placements in sequence
   * @param {Array<{x: number, y: number}>} cells - Array of cell coordinates
   */
  flagMultiple(cells) {
    log('info', `Flagging ${cells.length} cells`);
    for (const cell of cells) {
      this.placeFlag(cell.x, cell.y);
      sleep(config.delays.betweenMoves);
    }
  }
};

module.exports = actions;
