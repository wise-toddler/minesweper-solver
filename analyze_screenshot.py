#!/usr/bin/env python3
"""
Automatic Screen Configuration Analyzer for Minesweeper Bot
Analyzes a screenshot to extract config values automatically
"""

from PIL import Image
import sys

def rgb_to_hex(rgb):
    """Convert RGB tuple to hex string"""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def analyze_screenshot(image_path):
    """Analyze screenshot and extract configuration"""

    print("=" * 60)
    print("  Minesweeper Bot - Screenshot Analyzer")
    print("=" * 60)
    print()

    img = Image.open(image_path)
    width, height = img.size

    print(f"📱 Screen Resolution: {width}x{height}")
    print()

    # === DETECT GAME AREA ===
    print("🎮 Detecting Game Area...")

    # Sample top area to find where grid starts
    top_margin = 100
    for y in range(100, 300, 10):
        # Check if this row has game content (not UI)
        sample_colors = [img.getpixel((x, y)) for x in range(50, width-50, 50)]
        # Look for gray or blue cells (not UI background)
        game_colors = sum(1 for c in sample_colors if 150 < c[0] < 255 and 150 < c[1] < 255)
        if game_colors > 3:
            top_margin = y
            break

    # Sample bottom area
    bottom_margin = height - 100
    for y in range(height-100, height-300, -10):
        sample_colors = [img.getpixel((x, y)) for x in range(50, width-50, 50)]
        game_colors = sum(1 for c in sample_colors if 150 < c[0] < 255 and 150 < c[1] < 255)
        if game_colors > 3:
            bottom_margin = y
            break

    print(f"  Top: {top_margin}px")
    print(f"  Bottom: {bottom_margin}px")
    print(f"  Left: 0px (full width)")
    print(f"  Right: {width}px (full width)")
    print()

    # === DETECT CELL SIZE ===
    print("📐 Detecting Cell Size...")

    # Look for grid lines (pink/magenta vertical lines)
    vertical_lines = []
    mid_y = (top_margin + bottom_margin) // 2

    for x in range(100, 500, 1):
        pixel = img.getpixel((x, mid_y))
        # Pink grid line detection (high red, low green, high blue)
        if pixel[0] > 200 and pixel[1] < 100 and pixel[2] > 100:
            vertical_lines.append(x)

    # Find spacing between lines
    if len(vertical_lines) > 1:
        # Group nearby detections
        unique_lines = [vertical_lines[0]]
        for line in vertical_lines[1:]:
            if line - unique_lines[-1] > 20:  # More than 20px apart = different line
                unique_lines.append(line)

        if len(unique_lines) >= 2:
            cell_size = unique_lines[1] - unique_lines[0]
            print(f"  Detected cell size: {cell_size}px")
        else:
            cell_size = 120  # fallback
            print(f"  Could not detect grid lines, using default: {cell_size}px")
    else:
        cell_size = 120
        print(f"  Could not detect grid lines, using default: {cell_size}px")

    print()

    # === SAMPLE COLORS ===
    print("🎨 Sampling Colors...")
    print()

    # Sample different cell types from known regions
    samples = {
        "Unrevealed (gray)": (270, 300),
        "Revealed (blue with number)": (50, 200),
        "Revealed (blue, another spot)": (100, 400),
        "Flag/Gem (pink)": (350, 290),
        "Grid line (pink)": (270, 450),
    }

    colors = {}
    for label, (x, y) in samples.items():
        if 0 <= x < width and 0 <= y < height:
            rgb = img.getpixel((x, y))
            hex_color = rgb_to_hex(rgb)
            print(f"  {label}:")
            print(f"    Position: ({x}, {y})")
            print(f"    Color: {hex_color}  RGB{rgb}")

            # Store for config generation
            if "Unrevealed" in label:
                colors['covered'] = hex_color
            elif "Revealed" in label and 'revealed' not in colors:
                colors['revealed'] = hex_color
            elif "Flag" in label:
                colors['flag'] = hex_color

    print()

    # === GENERATE CONFIG ===
    print("=" * 60)
    print("📝 Generated config.js values:")
    print("=" * 60)
    print()
    print("screenWidth:", width, ",")
    print("screenHeight:", height, ",")
    print()
    print("gameArea: {")
    print(f"  top: {top_margin},")
    print(f"  bottom: {bottom_margin},")
    print(f"  left: 0,")
    print(f"  right: {width}")
    print("},")
    print()
    print(f"cellSize: {cell_size},")
    print()
    print("colors: {")
    for color_name, color_value in colors.items():
        print(f"  {color_name}: \"{color_value}\",")
    print("},")
    print()

    # === ADDITIONAL ANALYSIS ===
    print("=" * 60)
    print("🔍 Additional Analysis:")
    print("=" * 60)
    print()

    # Estimate grid dimensions
    game_height = bottom_margin - top_margin
    game_width = width
    rows = game_height // cell_size
    cols = game_width // cell_size
    print(f"Estimated visible grid: {rows} rows × {cols} columns")
    print(f"Total visible cells: {rows * cols}")
    print()

    print("✅ Configuration analysis complete!")
    print()
    print("Next steps:")
    print("1. Copy the generated config values above into config.js")
    print("2. Fine-tune color thresholds if detection is inaccurate")
    print("3. Test the bot on your device")
    print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_screenshot.py <screenshot_path>")
        print()
        print("Example:")
        print("  python3 analyze_screenshot.py /home/ansh/Downloads/Screenshot_*.jpg")
        sys.exit(1)

    screenshot_path = sys.argv[1]

    try:
        analyze_screenshot(screenshot_path)
    except FileNotFoundError:
        print(f"❌ Error: Screenshot file not found: {screenshot_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error analyzing screenshot: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
