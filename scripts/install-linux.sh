#!/bin/bash
set -e

RELEASE_URL="https://github.com/Satont/twirchat/releases/latest/download"
TARBALL="stable-linux-x64-TwirChat.tar.zst"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading TwirChat for Linux..."
curl -fsSL "$RELEASE_URL/$TARBALL" -o "$TMP_DIR/$TARBALL"

echo "Extracting..."
tar --zstd -xf "$TMP_DIR/$TARBALL" -C "$TMP_DIR"

APP_NAME="TwirChat"
APP_DIR="$HOME/.local/share/dev.twirchat.app/stable/app"
APPLICATIONS_DIR="$HOME/.local/share/applications"
BIN_DIR="$HOME/.local/bin"

echo "Installing to $APP_DIR..."
rm -rf "$APP_DIR"
mkdir -p "$(dirname "$APP_DIR")"
mv "$TMP_DIR/$APP_NAME" "$APP_DIR"

chmod +x "$APP_DIR/bin/launcher"

ICON_PATH=""
for path in "$APP_DIR/Resources/appIcon.png" "$APP_DIR/Resources/app/icon.png"; do
  if [ -f "$path" ]; then
    ICON_PATH="$path"
    break
  fi
done

mkdir -p "$APPLICATIONS_DIR"

cat > "$APPLICATIONS_DIR/twirchat.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=TwirChat
Comment=Multi-platform chat manager for streamers
Exec="$APP_DIR/bin/launcher" %u
TryExec=$APP_DIR/bin/launcher
Icon=${ICON_PATH:-$APP_DIR/Resources/appIcon.png}
Terminal=false
StartupWMClass=TwirChat
StartupNotify=true
Categories=Network;InstantMessaging;
EOF

chmod +x "$APPLICATIONS_DIR/twirchat.desktop"
echo "Added TwirChat to applications menu"

mkdir -p "$BIN_DIR"
ln -sf "$APP_DIR/bin/launcher" "$BIN_DIR/twirchat"
echo "Created symlink: twirchat -> $APP_DIR/bin/launcher"

if command -v update-desktop-database &> /dev/null; then
  update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
fi

if command -v gio &> /dev/null; then
  gio set "$APPLICATIONS_DIR/twirchat.desktop" metadata::trusted true 2>/dev/null || true
fi

echo "TwirChat installed successfully! Run 'twirchat' from terminal or find it in your app menu."
