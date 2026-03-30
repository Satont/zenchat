#!/usr/bin/env bash

# Generate icons for all platforms from SVG source
# Usage: ./generate-icons.sh

set -e

ASSETS_DIR="packages/desktop/assets"
SVG_SOURCE="$ASSETS_DIR/icon.svg"

if [ ! -f "$SVG_SOURCE" ]; then
  echo "Error: Source SVG not found at $SVG_SOURCE"
  exit 1
fi

echo "Generating icons from $SVG_SOURCE..."

# Create temp directories
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Generate PNG (Linux) at multiple sizes for best quality
convert -background none -density 300 -resize 256x256 "$SVG_SOURCE" "$ASSETS_DIR/icon.png"
echo "✓ Generated icon.png (256x256)"

# Generate ICO (Windows) - needs multiple sizes
convert -background none -density 300 -resize 256x256 "$SVG_SOURCE" -resize 128x128 -resize 64x64 -resize 48x48 -resize 32x32 -resize 16x16 "$ASSETS_DIR/icon.ico"
echo "✓ Generated icon.ico (multi-size)"

# Generate ICNS (macOS)
# ICNS requires a specific structure with iconset
ICONSET_DIR="$TEMP_DIR/TwirChat.iconset"
mkdir -p "$ICONSET_DIR"

# Generate all required sizes for macOS
sizes=(16 32 64 128 256 512 1024)
for size in "${sizes[@]}"; do
  # Standard resolution
  convert -background none -density 300 -resize ${size}x${size} "$SVG_SOURCE" "$ICONSET_DIR/icon_${size}x${size}.png"
  
  # Retina resolution (@2x)
  retina_size=$((size * 2))
  if [ $retina_size -le 1024 ]; then
    convert -background none -density 300 -resize ${retina_size}x${retina_size} "$SVG_SOURCE" "$ICONSET_DIR/icon_${size}x${size}@2x.png"
  fi
done

# Create ICNS from iconset
iconutil -c icns "$ICONSET_DIR" -o "$ASSETS_DIR/icon.icns"
echo "✓ Generated icon.icns"

echo ""
echo "All icons generated successfully in $ASSETS_DIR/"
ls -la "$ASSETS_DIR/"*.png "$ASSETS_DIR/"*.ico "$ASSETS_DIR/"*.icns 2>/dev/null || true
