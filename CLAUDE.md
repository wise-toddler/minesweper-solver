# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AutoX.js automation bot** for an infinite scrolling Minesweeper-style Android game. The bot runs entirely on Android devices via AutoX.js (a modern Auto.js fork) using Accessibility Service and screen-capture APIs.

## Development Workflow

### Cloud-Based Sync Architecture

Code is written on your **laptop** (Ubuntu/Mac/Windows) and automatically synced to Android:

1. **Laptop side**: Edit JavaScript files in your local project folder (synced with cloud storage)
2. **Cloud sync**: Files are synced via Google Drive or Dropbox
3. **Android side**: DriveSync/Dropsync app mirrors to `/sdcard/AutoX/scripts/`
4. **Execution**: Open AutoX.js app on phone, tap Run button on your script

**No USB cable required. No ADB. No Kotlin/Java compilation.**

### Testing on Device

1. Open the Infinite Minesweeper game manually on Android
2. Tap the AutoX.js floating button overlay
3. Select and run your script
4. The script runs as a background overlay service over the game
5. Watch live execution with optional visual overlays for debugging

## Code Architecture

All automation scripts are plain JavaScript (`.js`) files that use the AutoX.js runtime APIs:

### Core Automation APIs Available

- **Screen capture**: `captureScreen()` to grab current frame
- **Color detection**: `findColor()` to locate specific pixel patterns
- **OCR**: Optional PaddleOCR or image plugins for digit recognition
- **Input simulation**: `click(x, y)`, `swipe()`, `press()`, `longClick()`
- **Overlay UI**: Draw debugging boxes/text on screen during execution

### Expected Script Structure

```javascript
// 1. Grid Detection Module
//    - Analyze screen to find game grid boundaries
//    - Detect cell size and positions
//    - Map screen coordinates to grid indices

// 2. Cell Recognition Module
//    - Capture cell regions
//    - Use color matching or OCR to identify:
//      * Unrevealed cells
//      * Numbers (1-8)
//      * Flags
//      * Mines (after game over)

// 3. Solver Logic
//    - Implement Minesweeper constraint satisfaction
//    - Basic rules: count neighbors, flag obvious mines
//    - Advanced: probability calculation for uncertain cells

// 4. Action Executor
//    - Translate solver decisions to screen taps
//    - Handle scrolling for infinite board
//    - Manage flag placement vs cell reveal

// 5. Main Loop
//    - Capture → Analyze → Solve → Act → Repeat
//    - Handle game state changes (win, loss, scroll)
```

### Key Technical Considerations

- **Coordinate systems**: AutoX.js uses absolute pixel coordinates; maintain mapping between grid cells and screen positions
- **Performance**: Screen capture and image analysis are expensive; optimize frame rate vs accuracy
- **Synchronization**: Game animations may require delays between actions (`sleep()`)
- **Error recovery**: Detect and handle game-over states, UI popups, or unexpected screens

## AutoX.js Permissions Required on Android

Ensure these are granted in Android settings:
- Accessibility Service (for input simulation)
- Screen Capture (for reading pixels)
- Storage (for accessing `/sdcard/AutoX/scripts/`)
- Display over other apps (for floating button and overlays)

## Implementation Status

**✅ Core modules implemented and ready to test:**

- `main.js` - Entry point with game loop, stats tracking, and error handling
- `config.js` - Comprehensive configuration (mostly optional now!)
- `auto_config.js` - **NEW**: Auto-detects screen size, game area, cell size, colors at runtime
- `actions.js` - Input wrappers (tap, long-press, swipe, scroll)
- `vision.js` - Screen capture, color detection, cell state recognition
- `grid.js` - Grid detection, coordinate mapping, neighbor analysis
- `solver.js` - Constraint satisfaction solver with probability-based guessing
- `debug.js` - Logging, statistics, and visualization utilities

**🎯 Device-Agnostic: Works on ANY Android device without manual configuration!**

## Getting Started

### Zero Configuration Required! 🎉

The bot automatically detects everything at runtime:
- ✅ Screen resolution
- ✅ Game area boundaries
- ✅ Cell size from grid patterns
- ✅ Cell colors (covered, revealed, flags)

**Just run it - no config needed!**

### Running the Bot

```
1. Open Minesweeper game on Android
2. Open AutoX.js app
3. Navigate to /sdcard/AutoX/scripts/minesweeper/
4. Tap main.js and press ▶️ Run
5. You have 3 seconds to switch back to the game
6. Bot will auto-detect grid and start playing
7. Press Volume Down to stop
```

## Module Interactions

```
main.js (orchestrator)
  ├─> auto_config.js (detectConfiguration) ← NEW: Auto-detect everything!
  ├─> vision.js (requestPermission, captureScreen)
  ├─> grid.js (detectGrid, initializeGrid, scanGrid)
  ├─> solver.js (getNextMove)
  │     └─> grid.js (getCell, getNeighbors, countNeighborsByState)
  └─> actions.js (revealCell, placeFlag, scroll)
        └─> config.js (delays, timing settings)

config.js = optional overrides only (timing, solver behavior)
auto_config.js = runtime detection of screen/grid/colors
debug.js is used by all modules for logging
```

## Configuration Tuning (Optional)

### Auto-Detection Works Out of the Box

The bot automatically detects everything, but you can override if needed:

**To manually configure (only if auto-detection fails):**
1. Set `config.gameAreaManual = true` in `config.js`
2. Measure game area coordinates from a screenshot
3. Update `config.gameArea` values

**Color detection:**
- Auto-sampled from first screenshot
- Usually accurate without tuning
- Override in `config.colors` if needed

### Performance Tuning

- `delays.betweenMoves`: Lower for speed, higher for stability
- `delays.screenCapture`: Must be long enough for screen to update after actions
- `solver.useAdvancedLogic`: Disable for simpler (faster) logic
- `debug.enabled`: Disable in production for slight performance gain

## Solver Algorithm

The bot uses two-pass solving:

**Pass 1: Constraint Satisfaction (100% safe moves)**
- For each revealed number N with F flags and C covered neighbors:
  - If F = N: reveal all C covered neighbors (all mines found)
  - If F + C = N: flag all C covered neighbors (all are mines)

**Pass 2: Probability-Based Guessing** (when no safe moves)
- Calculate mine probability for each covered cell based on neighboring numbers
- Choose cell with lowest mine probability
- Fall back to random guess if no good candidates

**Pass 3: Scrolling** (infinite board)
- When X% of visible cells revealed, scroll to reveal new area
- Reset detection for new grid section

## Debugging Strategies

- **Enable debug mode** in `config.js`: `debug.enabled = true`
- **Console logs**: AutoX.js shows console output in real-time
- **Toast messages**: On-screen notifications for major events
- **Screenshot saving**: Capture each frame for offline analysis
- **Stats display**: Shows moves, flags, revealed count every 10 moves
- **Grid visualization**: (Planned) Draw overlay boxes on detected cells

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Screen capture permission denied" | Permission not granted | Re-run and grant permission in popup |
| "No moves available" repeatedly | Color detection failing | Re-sample colors in config.js |
| Bot clicks wrong positions | Grid detection off | Verify gameArea coordinates |
| Bot too slow | Delays too high | Reduce delays in config.js |
| Bot makes mistakes | Color thresholds too loose | Lower threshold values |
| Grid not detected | Game UI different | Manually set cellSize in config |

## Development Tips

- **Test color detection first**: Run vision.detectCellState() on known cells
- **Verify grid coordinates**: Use debug.drawRect() to visualize detected grid
- **Start with manual config**: Auto-detection may fail on first try
- **Iterate on colors**: Different devices/games have different color schemes
- **Watch the console**: Real-time logs show what the bot is "thinking"
