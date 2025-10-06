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

## File Organization

Keep scripts modular for maintainability:
- `main.js` - Entry point and main loop
- `grid.js` - Grid detection and cell mapping
- `vision.js` - Screen capture and recognition
- `solver.js` - Minesweeper logic
- `actions.js` - Input simulation helpers
- `config.js` - Tunable parameters (colors, delays, thresholds)

## Debugging Strategies

- Use `console.log()` - appears in AutoX.js console
- Draw overlay rectangles with `canvas` module to visualize detected cells
- Add `toast()` messages for state transitions
- Save captured screenshots to `/sdcard/` for offline analysis
- Test individual modules in isolation before integration
