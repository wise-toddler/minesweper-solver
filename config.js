/**
 * Configuration for Minesweeper Bot
 * Adjust these values based on your device and game UI
 */

const config = {
  // ===== DEVICE SETTINGS =====
  screenWidth: 1080,  // Your device screen width in pixels
  screenHeight: 2400, // Your device screen height in pixels

  // ===== GAME UI BOUNDARIES =====
  // Define the game grid area (adjust after visual inspection)
  gameArea: {
    top: 200,      // Pixels from top of screen
    bottom: 2200,  // Pixels from top of screen
    left: 50,      // Pixels from left
    right: 1030    // Pixels from left
  },

  // ===== CELL DETECTION =====
  // Estimated cell size (will be auto-detected, but good starting point)
  cellSize: 80,  // Approximate cell width/height in pixels

  // Color thresholds for cell state detection (RGB)
  colors: {
    // Unrevealed/covered cell color
    covered: "#AAAAAA",
    coveredThreshold: 30,  // Color match tolerance

    // Revealed empty cell color
    revealed: "#EEEEEE",
    revealedThreshold: 30,

    // Flag marker color
    flag: "#FF0000",
    flagThreshold: 40,

    // Mine color (after game over)
    mine: "#000000",
    mineThreshold: 30,

    // Number colors (1-8) - adjust based on game's color scheme
    numbers: {
      "1": "#0000FF",  // Blue
      "2": "#008000",  // Green
      "3": "#FF0000",  // Red
      "4": "#000080",  // Dark Blue
      "5": "#800000",  // Maroon
      "6": "#00FFFF",  // Cyan
      "7": "#000000",  // Black
      "8": "#808080"   // Gray
    }
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
