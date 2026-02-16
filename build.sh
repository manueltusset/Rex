#!/usr/bin/env bash
set -euo pipefail

RUST_TARGET_LINUX="x86_64-unknown-linux-gnu"
RUST_TARGET_MACOS="aarch64-apple-darwin"
RUST_TARGET_WINDOWS="x86_64-pc-windows-msvc"
DOCKER_IMAGE="rex-builder"

check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo "ERROR: '$1' not found. Please install it first."
    exit 1
  fi
}

build_linux() {
  check_command docker

  echo "=== Rex Build: Linux via Docker (${RUST_TARGET_LINUX}) ==="
  echo "Base image: Ubuntu 22.04 (glibc 2.35)"
  echo ""

  echo "Building Docker image..."
  docker build -t "$DOCKER_IMAGE" -f Dockerfile.linux .

  echo ""
  echo "Building Rex inside container..."
  docker run --rm \
    -v "$(pwd)":/app \
    -w /app \
    "$DOCKER_IMAGE" \
    bash -c "npm ci && npm run tauri build -- --target ${RUST_TARGET_LINUX}"

  BUNDLE_DIR="src-tauri/target/${RUST_TARGET_LINUX}/release/bundle"
  echo ""
  echo "Build complete. Artifacts:"
  find "$BUNDLE_DIR" -name "*.deb" -o -name "*.AppImage" 2>/dev/null | while read -r f; do echo "  $f"; done
}

build_macos() {
  check_command node
  check_command npm
  check_command cargo

  echo "=== Rex Build: macOS native (${RUST_TARGET_MACOS}) ==="
  echo ""

  rustup target add "$RUST_TARGET_MACOS" 2>/dev/null || true

  echo "Installing frontend dependencies..."
  npm ci

  echo ""
  echo "Building Rex for ${RUST_TARGET_MACOS}..."
  npm run tauri build -- --target "$RUST_TARGET_MACOS"

  BUNDLE_DIR="src-tauri/target/${RUST_TARGET_MACOS}/release/bundle"
  echo ""
  echo "Build complete. Artifacts:"
  find "$BUNDLE_DIR" -name "*.dmg" 2>/dev/null | while read -r f; do echo "  $f"; done
}

build_windows() {
  check_command node
  check_command npm
  check_command cargo

  echo "=== Rex Build: Windows native (${RUST_TARGET_WINDOWS}) ==="
  echo ""

  rustup target add "$RUST_TARGET_WINDOWS" 2>/dev/null || true

  echo "Installing frontend dependencies..."
  npm ci

  echo ""
  echo "Building Rex for ${RUST_TARGET_WINDOWS}..."
  npm run tauri build -- --target "$RUST_TARGET_WINDOWS"

  BUNDLE_DIR="src-tauri/target/${RUST_TARGET_WINDOWS}/release/bundle"
  echo ""
  echo "Build complete. Artifacts:"
  find "$BUNDLE_DIR" -name "*.exe" 2>/dev/null | while read -r f; do echo "  $f"; done
}

# Detectar plataforma
OS="$(uname -s)"
case "$OS" in
  Darwin)
    build_macos
    ;;
  Linux)
    build_linux
    ;;
  MINGW*|MSYS*|CYGWIN*)
    build_windows
    ;;
  *)
    echo "ERROR: Unsupported platform '${OS}'."
    echo ""
    echo "Supported platforms:"
    echo "  macOS   - run this script natively"
    echo "  Linux   - run this script natively (uses Docker)"
    echo "  Windows - run this script via Git Bash"
    exit 1
    ;;
esac
