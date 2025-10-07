/**
 * Configuration for Minesweeper Bot
 *
 * ✨ AUTO-DETECTION ENABLED ✨
 * The bot automatically detects screen size, game area, cell size, and colors!
 * You don't need to configure anything - just run it.
 *
 * Manual configuration only needed if auto-detection fails or for fine-tuning.
 */

const config = {
  // ===== DEVICE SETTINGS (AUTO-DETECTED) =====
  // Leave null to auto-detect, or set values to override
  screenWidth: null,  // Auto-detected from device screen
  screenHeight: null, // Auto-detected from device screen

  // ===== GAME UI BOUNDARIES (AUTO-DETECTED) =====
  // Auto-detection finds where grid starts/ends automatically
  // Set gameAreaManual: true only if you want to override
  gameAreaManual: false,
  gameArea: {
    top: 200,      // Pixels from top of screen
    bottom: 2200,  // Pixels from top of screen
    left: 50,      // Pixels from left
    right: 1030    // Pixels from left
  },

  // ===== CELL DETECTION (AUTO-DETECTED) =====
  // Bot detects cell size from grid line patterns
  cellSize: 80,  // Leave as 80 for auto-detection

  // Color thresholds for cell state detection (AUTO-DETECTED)
  colors: {
    // Unrevealed/covered cell color (gray)
    covered: "#AAAAAA",
    coveredThreshold: 30,

    // Revealed cell color (blue with numbers)
    revealed: "#EEEEEE",
    revealedThreshold: 30,

    // Flag marker color (pink/red)
    flag: "#FF0000",
    flagThreshold: 40,

    // Mine color (black, after game over)
    mine: "#000000",
    mineThreshold: 30
  },

  // ===== TIMING & PERFORMANCE =====
  delays: {
    betweenMoves: 200,      // Milliseconds between actions
    afterClick: 100,        // Wait after cell reveal
    afterFlag: 50,          // Wait after flag placement
    screenCapture: 500,     // Delay between screen captures
    longPress: 600          // Long press duration for flagging
  },

  // ===== SOLVER BEHAVIOR =====
  solver: {
    maxIterations: 100,     // Max solver iterations per frame
    useAdvancedLogic: true, // Enable probability-based guessing
    safeProbability: 0.8,   // Minimum probability to consider move safe
    flagObviousMines: true, // Auto-flag when mine is certain
  },

  // ===== SCROLLING (for infinite board) =====
  scroll: {
    enabled: true,
    direction: "down",      // "down", "up", "left", "right"
    pixelsPerScroll: 400,   // Distance to scroll
    whenToScroll: 0.7,      // Scroll when 70% of visible cells solved
  },

  // ===== DEBUGGING =====
  debug: {
    enabled: true,
    showOverlay: true,      // Draw grid overlay on screen
    logLevel: "info",       // "debug", "info", "warn", "error"
    saveScreenshots: false, // Save frames to /sdcard/
    screenshotPath: "/sdcard/minesweeper_debug/"
  }
};

module.exports = config;
