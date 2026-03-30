# TwirChat Release Configuration

This document describes the automated release pipeline for TwirChat.

## Overview

The release pipeline is fully automated via GitHub Actions and triggers on:
- Pushing a version tag (e.g., `v1.0.0`)
- Manual workflow dispatch with a version input

## What Gets Released

### Desktop Application
- **Linux**: x64 and ARM64 binaries + AppImage
- **macOS**: ARM64 (Apple Silicon) and x64 (Intel) binaries
- **Windows**: x64 binary

### Backend
- Compiled binary for Linux x64
- Docker image (published to GitHub Container Registry)

## Release Features

### Automatic Changelog
- Generated using conventional commits
- Categorized by commit types (features, fixes, etc.)
- Included in GitHub Release notes

### Environment Configuration
Production builds use environment variables from GitHub Secrets:
- `BACKEND_URL` - Backend HTTP URL
- `BACKEND_WS_URL` - Backend WebSocket URL

## How to Create a Release

### Method 1: Push a Tag (Recommended)

```bash
# Create and push a new version tag
git tag v1.0.0
git push origin v1.0.0
```

The workflow will automatically:
1. Generate changelog from commits
2. Build desktop apps for all platforms
3. Build backend binary and Docker image
4. Create GitHub Release with all artifacts

### Method 2: Manual Trigger

1. Go to GitHub Actions → Release workflow
2. Click "Run workflow"
3. Enter version (e.g., `v1.0.0`)
4. Click "Run workflow"

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required variables for production:
- `CHATRIX_BACKEND_URL` - Backend HTTP endpoint
- `CHATRIX_BACKEND_WS_URL` - Backend WebSocket endpoint

Optional variables:
- `AUTH_SERVER_PORT` - Local auth callback port (default: 45821)
- `OVERLAY_SERVER_PORT` - Overlay server port (default: 45823)
- `DB_PATH` - SQLite database path

## Docker Deployment

### Pull from GitHub Container Registry

```bash
docker pull ghcr.io/YOUR_USERNAME/twirchat/backend:latest
```

### Run the container

```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  ghcr.io/YOUR_USERNAME/twirchat/backend:latest
```

## Local Build

### Desktop

```bash
cd packages/desktop

# Development
bun run dev

# Production build for current platform
bun run build:prod

# Cross-compile for specific platforms
bunx electrobun build --env=stable --targets=linux-x64,macos-arm64
```

### Backend

```bash
cd packages/backend

# Development
bun run dev

# Compile to binary
bun run build:prod

# Docker build
docker build -t twirchat-backend .
```

## AppImage (Linux)

The Linux build automatically creates an AppImage for easy distribution:
- Self-contained executable
- Works on most Linux distributions
- No installation required
- Automatic updates via zsync

## Troubleshooting

### Build Failures

1. Check that all secrets are set in GitHub repository settings
2. Ensure `bun.lock` is committed and up to date
3. Verify all dependencies are properly declared in package.json

### Missing Artifacts

If artifacts are missing from the release:
1. Check the workflow logs for specific platform failures
2. Verify the artifact upload step completed successfully
3. Check artifact retention settings (default: 90 days)

### Docker Push Failures

Ensure the GitHub token has proper permissions:
- Go to Settings → Actions → General
- Enable "Read and write permissions" for workflows
