/**
 * Minesweeper Solver Module
 * Constraint satisfaction and probability-based solving logic
 */

const config = require('./config.js');
const grid = require('./grid.js');
const { log } = require('./debug.js');

const solver = {
  /**
   * Find all safe moves (cells guaranteed to be safe)
   * @returns {Array<{row, col, action}>} Array of moves: action = 'reveal' or 'flag'
   */
  findSafeMoves() {
    const moves = [];

    if (!grid.cells.length) {
      log('warn', 'No grid data available');
      return moves;
    }

    const { rows, cols } = grid.gridInfo;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid.getCell(row, col);

        // Only analyze revealed cells with numbers
        if (cell.state !== 'revealed' || cell.value === 0 || cell.value === null) {
          continue;
        }

        const neighbors = grid.getNeighbors(row, col);
        const coveredNeighbors = neighbors.filter(n => n.cell.state === 'covered');
        const flaggedNeighbors = neighbors.filter(n => n.cell.state === 'flag');

        const mineCount = cell.value;
        const flaggedCount = flaggedNeighbors.length;
        const coveredCount = coveredNeighbors.length;

        // Rule 1: If all mines are flagged, reveal remaining neighbors
        if (flaggedCount === mineCount && coveredCount > 0) {
          for (const n of coveredNeighbors) {
            moves.push({
              row: n.row,
              col: n.col,
              action: 'reveal',
              confidence: 1.0,
              reason: `All ${mineCount} mines flagged around (${row},${col})`
            });
          }
        }

        // Rule 2: If remaining covered cells equal remaining mines, flag them all
        if (coveredCount + flaggedCount === mineCount && coveredCount > 0) {
          for (const n of coveredNeighbors) {
            moves.push({
              row: n.row,
              col: n.col,
              action: 'flag',
              confidence: 1.0,
              reason: `${coveredCount} covered = ${mineCount - flaggedCount} remaining mines at (${row},${col})`
            });
          }
        }
      }
    }

    // Remove duplicates (same cell might be marked safe by multiple constraints)
    const uniqueMoves = this.deduplicateMoves(moves);
    log('info', `Found ${uniqueMoves.length} safe moves`);

    return uniqueMoves;
  },

  /**
   * Remove duplicate moves, keeping highest confidence
   * @param {Array<Object>} moves - Array of moves
   * @returns {Array<Object>} Deduplicated moves
   */
  deduplicateMoves(moves) {
    const moveMap = new Map();

    for (const move of moves) {
      const key = `${move.row},${move.col}`;
      const existing = moveMap.get(key);

      if (!existing || move.confidence > existing.confidence) {
        moveMap.set(key, move);
      }
    }

    return Array.from(moveMap.values());
  },

  /**
   * Find best guess when no safe moves available (probability-based)
   * @returns {Object|null} Best guess move or null
   */
  findBestGuess() {
    if (!config.solver.useAdvancedLogic) {
      return this.findRandomCovered();
    }

    const probabilities = this.calculateProbabilities();

    if (probabilities.length === 0) {
      return this.findRandomCovered();
    }

    // Sort by safest probability (lowest mine probability)
    probabilities.sort((a, b) => a.mineProbability - b.mineProbability);

    const best = probabilities[0];

    if (best.mineProbability <= (1 - config.solver.safeProbability)) {
      log('info', `Best guess: (${best.row},${best.col}) - ${(best.mineProbability * 100).toFixed(1)}% mine probability`);
      return {
        row: best.row,
        col: best.col,
        action: 'reveal',
        confidence: 1 - best.mineProbability,
        reason: 'Probability-based guess'
      };
    }

    log('warn', 'No safe guesses available');
    return null;
  },

  /**
   * Calculate mine probabilities for covered cells
   * @returns {Array<Object>} Array of {row, col, mineProbability}
   */
  calculateProbabilities() {
    const probabilities = [];
    const { rows, cols } = grid.gridInfo;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid.getCell(row, col);

        if (cell.state !== 'covered') continue;

        // Calculate probability based on neighboring revealed cells
        const neighbors = grid.getNeighbors(row, col);
        const revealedNeighbors = neighbors.filter(n =>
          n.cell.state === 'revealed' && n.cell.value > 0
        );

        if (revealedNeighbors.length === 0) {
          // No information, assume average probability
          probabilities.push({
            row,
            col,
            mineProbability: 0.15 // Default 15% mine rate
          });
          continue;
        }

        // Simple heuristic: average the local mine density
        let totalProbability = 0;

        for (const n of revealedNeighbors) {
          const neighborCell = n.cell;
          const neighborNeighbors = grid.getNeighbors(n.row, n.col);
          const coveredCount = neighborNeighbors.filter(nn => nn.cell.state === 'covered').length;
          const flaggedCount = neighborNeighbors.filter(nn => nn.cell.state === 'flag').length;
          const remainingMines = neighborCell.value - flaggedCount;

          if (coveredCount > 0) {
            totalProbability += remainingMines / coveredCount;
          }
        }

        const avgProbability = totalProbability / revealedNeighbors.length;

        probabilities.push({
          row,
          col,
          mineProbability: Math.min(1.0, Math.max(0.0, avgProbability))
        });
      }
    }

    return probabilities;
  },

  /**
   * Find a random covered cell (last resort)
   * @returns {Object|null} Random move or null
   */
  findRandomCovered() {
    const { rows, cols } = grid.gridInfo;
    const covered = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid.getCell(row, col);
        if (cell.state === 'covered') {
          covered.push({ row, col });
        }
      }
    }

    if (covered.length === 0) {
      return null;
    }

    const random = covered[Math.floor(Math.random() * covered.length)];
    log('info', `Random guess: (${random.row},${random.col})`);

    return {
      ...random,
      action: 'reveal',
      confidence: 0.5,
      reason: 'Random guess'
    };
  },

  /**
   * Get next move (safe move or best guess)
   * @returns {Object|null} Next move or null if no moves available
   */
  getNextMove() {
    // First, try to find guaranteed safe moves
    const safeMoves = this.findSafeMoves();

    if (safeMoves.length > 0) {
      // Prioritize reveals over flags
      const reveals = safeMoves.filter(m => m.action === 'reveal');
      const flags = safeMoves.filter(m => m.action === 'flag');

      // Flag obvious mines first if configured
      if (config.solver.flagObviousMines && flags.length > 0) {
        return flags[0];
      }

      // Otherwise reveal safe cells
      if (reveals.length > 0) {
        return reveals[0];
      }

      return safeMoves[0];
    }

    // No safe moves, try educated guess
    return this.findBestGuess();
  },

  /**
   * Get multiple moves at once (for batch execution)
   * @param {number} count - Maximum number of moves
   * @returns {Array<Object>} Array of moves
   */
  getNextMoves(count = 5) {
    const moves = [];
    const safeMoves = this.findSafeMoves();

    // Take up to 'count' safe moves
    for (let i = 0; i < Math.min(count, safeMoves.length); i++) {
      moves.push(safeMoves[i]);
    }

    // If not enough safe moves, add one guess
    if (moves.length === 0) {
      const guess = this.findBestGuess();
      if (guess) {
        moves.push(guess);
      }
    }

    return moves;
  },

  /**
   * Check if grid is solved (all non-mine cells revealed)
   * @returns {boolean} True if solved
   */
  isSolved() {
    const { rows, cols } = grid.gridInfo;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid.getCell(row, col);
        // If there are covered cells that aren't flagged, not solved
        if (cell.state === 'covered') {
          return false;
        }
      }
    }

    return true;
  }
};

module.exports = solver;
