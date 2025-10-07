# Minesweeper Bot for AutoX.js

Automated solver for infinite Minesweeper-style Android games using AutoX.js.

**🎯 Device-Agnostic: Zero configuration required - works on any Android device!**

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
   - Files auto-sync to phone
   - **No configuration needed!** Bot auto-detects everything

3. **Run Bot:**
   - Open Minesweeper game on Android
   - Tap AutoX.js floating button
   - Select and run `main.js`
   - Bot will take over and play automatically

## Auto-Detection Features ✨

The bot automatically detects at runtime:
- ✅ Screen resolution (any device)
- ✅ Game area boundaries (where grid starts/ends)
- ✅ Cell size from grid patterns
- ✅ Cell colors (covered, revealed, flags)

**No manual configuration needed!** Just run it.

## Optional Configuration

`config.js` is now **optional** - only customize if you want to:
- Adjust timing delays for performance
- Change solver behavior (advanced logic, probability thresholds)
- Enable debug overlays and logging
- Override auto-detection (if it fails for your game)

## Project Structure

```
minesweeper/
├── main.js          # Entry point and game loop
├── config.js        # Optional tuning parameters
├── auto_config.js   # Auto-detection (screen, grid, colors)
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
