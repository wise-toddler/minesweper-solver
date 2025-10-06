/**
 * Grid Detection Module
 * Analyzes screen to detect grid structure and map cells
 */

const config = require('./config.js');
const vision = require('./vision.js');
const { log } = require('./debug.js');

const grid = {
  // Grid state
  cells: [], // 2D array of cell objects
  gridInfo: null, // {cellSize, offsetX, offsetY, rows, cols}

  /**
   * Auto-detect grid from screen capture
   * @param {Image} img - Captured screen image
   * @returns {Object} Grid info {cellSize, offsetX, offsetY, rows, cols}
   */
  detectGrid(img) {
    const { gameArea } = config;

    // Try to detect grid lines
    const lines = vision.detectGridLines(img);

    let cellSize = config.cellSize;
    let offsetX = gameArea.left;
    let offsetY = gameArea.top;

    // Calculate cell size from detected lines
    if (lines.verticalLines.length > 1) {
      const spacings = [];
      for (let i = 1; i < lines.verticalLines.length; i++) {
        spacings.push(lines.verticalLines[i] - lines.verticalLines[i-1]);
      }
      // Use median spacing as cell size
      spacings.sort((a, b) => a - b);
      cellSize = spacings[Math.floor(spacings.length / 2)];
      offsetX = lines.verticalLines[0];
      log('info', `Detected cell width: ${cellSize}px`);
    }

    if (lines.horizontalLines.length > 1) {
      const spacings = [];
      for (let i = 1; i < lines.horizontalLines.length; i++) {
        spacings.push(lines.horizontalLines[i] - lines.horizontalLines[i-1]);
      }
      spacings.sort((a, b) => a - b);
      const heightSize = spacings[Math.floor(spacings.length / 2)];
      offsetY = lines.horizontalLines[0];
      log('info', `Detected cell height: ${heightSize}px`);

      // Use average if width and height differ
      cellSize = Math.round((cellSize + heightSize) / 2);
    }

    // Calculate grid dimensions
    const gridWidth = gameArea.right - gameArea.left;
    const gridHeight = gameArea.bottom - gameArea.top;

    const cols = Math.floor(gridWidth / cellSize);
    const rows = Math.floor(gridHeight / cellSize);

    // Center the grid in game area
    offsetX = gameArea.left + Math.floor((gridWidth - cols * cellSize) / 2);
    offsetY = gameArea.top + Math.floor((gridHeight - rows * cellSize) / 2);

    this.gridInfo = { cellSize, offsetX, offsetY, rows, cols };
    log('info', `Grid detected: ${rows}x${cols}, cell size: ${cellSize}px`);
    log('debug', `Grid offset: (${offsetX}, ${offsetY})`);

    return this.gridInfo;
  },

  /**
   * Get screen coordinates for a grid cell
   * @param {number} row - Grid row index
   * @param {number} col - Grid column index
   * @returns {Object} {x, y} screen coordinates (center of cell)
   */
  cellToScreen(row, col) {
    if (!this.gridInfo) {
      log('error', 'Grid not initialized');
      return null;
    }

    const { cellSize, offsetX, offsetY } = this.gridInfo;
    const x = offsetX + col * cellSize + cellSize / 2;
    const y = offsetY + row * cellSize + cellSize / 2;

    return { x: Math.round(x), y: Math.round(y) };
  },

  /**
   * Get grid cell indices from screen coordinates
   * @param {number} x - Screen x coordinate
   * @param {number} y - Screen y coordinate
   * @returns {Object} {row, col} or null if outside grid
   */
  screenToCell(x, y) {
    if (!this.gridInfo) {
      log('error', 'Grid not initialized');
      return null;
    }

    const { cellSize, offsetX, offsetY, rows, cols } = this.gridInfo;

    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return null; // Outside grid
    }

    return { row, col };
  },

  /**
   * Initialize grid state matrix
   * @param {Image} img - Captured screen image
   */
  initializeGrid(img) {
    if (!this.gridInfo) {
      this.detectGrid(img);
    }

    const { rows, cols } = this.gridInfo;
    this.cells = [];

    for (let row = 0; row < rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < cols; col++) {
        this.cells[row][col] = {
          state: 'unknown', // 'unknown', 'covered', 'revealed', 'flag', 'mine', or number
          value: null, // Number 0-8 for revealed cells
          neighbors: this.getNeighborIndices(row, col)
        };
      }
    }

    log('info', `Grid initialized: ${rows}x${cols} = ${rows * cols} cells`);
  },

  /**
   * Get neighbor cell indices (8 directions)
   * @param {number} row - Cell row
   * @param {number} col - Cell column
   * @returns {Array<{row, col}>} Array of neighbor indices
   */
  getNeighborIndices(row, col) {
    const { rows, cols } = this.gridInfo || { rows: Infinity, cols: Infinity };
    const neighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue; // Skip self

        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          neighbors.push({ row: newRow, col: newCol });
        }
      }
    }

    return neighbors;
  },

  /**
   * Scan all visible cells and update grid state
   * @param {Image} img - Captured screen image
   */
  scanGrid(img) {
    if (!this.gridInfo) {
      this.initializeGrid(img);
    }

    const { rows, cols } = this.gridInfo;
    let scannedCount = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const coords = this.cellToScreen(row, col);
        const state = vision.detectCellState(img, coords.x, coords.y);

        const cell = this.cells[row][col];
        cell.state = typeof state === 'number' ? 'revealed' : state;
        cell.value = typeof state === 'number' ? state : null;

        scannedCount++;
      }
    }

    log('debug', `Scanned ${scannedCount} cells`);
  },

  /**
   * Get cell state
   * @param {number} row - Cell row
   * @param {number} col - Cell column
   * @returns {Object|null} Cell object or null
   */
  getCell(row, col) {
    if (!this.cells[row] || !this.cells[row][col]) {
      return null;
    }
    return this.cells[row][col];
  },

  /**
   * Get all neighbors of a cell
   * @param {number} row - Cell row
   * @param {number} col - Cell column
   * @returns {Array<Object>} Array of neighbor cell objects with {row, col, cell}
   */
  getNeighbors(row, col) {
    const cell = this.getCell(row, col);
    if (!cell) return [];

    return cell.neighbors.map(n => ({
      row: n.row,
      col: n.col,
      cell: this.getCell(n.row, n.col)
    })).filter(n => n.cell !== null);
  },

  /**
   * Count neighbors by state
   * @param {number} row - Cell row
   * @param {number} col - Cell column
   * @param {string} state - State to count ('covered', 'flag', etc.)
   * @returns {number} Count of neighbors with given state
   */
  countNeighborsByState(row, col, state) {
    const neighbors = this.getNeighbors(row, col);
    return neighbors.filter(n => n.cell.state === state).length;
  },

  /**
   * Get statistics about current grid state
   * @returns {Object} Statistics
   */
  getStats() {
    if (!this.cells.length) return null;

    const stats = {
      total: 0,
      covered: 0,
      revealed: 0,
      flags: 0,
      unknown: 0
    };

    for (const row of this.cells) {
      for (const cell of row) {
        stats.total++;
        if (cell.state === 'covered') stats.covered++;
        else if (cell.state === 'revealed') stats.revealed++;
        else if (cell.state === 'flag') stats.flags++;
        else stats.unknown++;
      }
    }

    return stats;
  },

  /**
   * Reset grid state
   */
  reset() {
    this.cells = [];
    this.gridInfo = null;
    log('info', 'Grid reset');
  }
};

module.exports = grid;
