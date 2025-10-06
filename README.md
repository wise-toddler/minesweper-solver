# Minesweeper Bot for AutoX.js

Automated solver for infinite Minesweeper-style Android games using AutoX.js.

## Quick Start

### Prerequisites
- **Android Device** with AutoX.js installed
- **Cloud Sync App** (DriveSync for Google Drive or Dropsync for Dropbox)
- **Minesweeper Game** installed on Android

### Setup

1. **On Android:**
   - Install AutoX.js and grant all permissions (Accessibility, Screen Capture, Storage, Overlay)
   - Install DriveSync/Dropsync
   - Configure sync: Cloud folder → `/sdcard/AutoX/scripts/minesweeper/`

2. **On Laptop:**
   - Clone this repo into your cloud-synced folder
   - Edit `config.js` with your device screen resolution and game UI boundaries
   - Files auto-sync to phone

3. **Run Bot:**
   - Open Minesweeper game on Android
   - Tap AutoX.js floating button
   - Select and run `main.js`
   - Bot will take over and play automatically

## Configuration

Edit `config.js` to customize:
- Screen resolution and game area coordinates
- Cell colors for detection (sample colors from your game)
- Timing delays and performance settings
- Solver behavior (advanced logic, probability thresholds)
- Debug overlays and logging

## Project Structure

```
minesweeper/
├── main.js          # Entry point and game loop
├── config.js        # All tunable parameters
├── actions.js       # Input simulation (tap, swipe, flag)
├── vision.js        # Screen capture and color detection
├── grid.js          # Grid detection and cell mapping
├── solver.js        # Minesweeper AI logic
└── debug.js         # Overlay visualization and logging
```

## How It Works

1. **Capture** screen and detect game grid
2. **Analyze** each cell (unrevealed, number, flag, mine)
3. **Solve** using constraint satisfaction (numbers = adjacent mines)
4. **Act** on safe moves (reveal cells or place flags)
5. **Scroll** when visible area is mostly solved
6. **Repeat** until game over or stopped

## Debugging

Enable debug mode in `config.js`:
```javascript
debug: {
  enabled: true,
  showOverlay: true,    // Visual grid overlay
  logLevel: "debug",    // Verbose console logs
  saveScreenshots: true // Save frames to /sdcard/
}
```

View logs in AutoX.js console during execution.

## Development

- Edit code on laptop (any IDE)
- Save → auto-syncs to phone
- Run → test immediately
- Iterate fast without USB/ADB

## License

MIT
