#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$PROJECT_DIR/../.." && pwd)"
APP_PATH="$ROOT_DIR/outputs/LuffyDesktop.app"

cd "$PROJECT_DIR"
mkdir -p .swiftpm-cache .swiftpm-config .swiftpm-security .clang-module-cache
export SWIFTPM_MODULECACHE_OVERRIDE="$PROJECT_DIR/.clang-module-cache"
export CLANG_MODULE_CACHE_PATH="$PROJECT_DIR/.clang-module-cache"
swift build -c release \
  --disable-sandbox \
  --sdk /Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk \
  --cache-path "$PROJECT_DIR/.swiftpm-cache" \
  --config-path "$PROJECT_DIR/.swiftpm-config" \
  --security-path "$PROJECT_DIR/.swiftpm-security" \
  --manifest-cache local

rm -rf "$APP_PATH"
mkdir -p "$APP_PATH/Contents/MacOS" "$APP_PATH/Contents/Resources"
cp .build/release/LuffyDesktop "$APP_PATH/Contents/MacOS/LuffyDesktop"
cp Sources/LuffyDesktop/Info.plist "$APP_PATH/Contents/Info.plist"
cp Sources/LuffyDesktop/Resources/idle.gif "$APP_PATH/Contents/Resources/idle.gif"
printf 'APPL????' > "$APP_PATH/Contents/PkgInfo"
chmod +x "$APP_PATH/Contents/MacOS/LuffyDesktop"
plutil -lint "$APP_PATH/Contents/Info.plist"
codesign --force --deep --sign - "$APP_PATH"
codesign --verify --deep --strict "$APP_PATH"
echo "Built $APP_PATH"

INSTALLED_APP="$HOME/Applications/Luffy Companion.app"
mkdir -p "$HOME/Applications"
rm -rf "$INSTALLED_APP"
cp -R "$APP_PATH" "$INSTALLED_APP"
codesign --force --deep --sign - "$INSTALLED_APP"
echo "Installed $INSTALLED_APP"
