#!/bin/bash

# Script to build and submit Firefox extension locally
# Usage: ./scripts/submit-firefox.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load all variables from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo -e "${GREEN}Loading .env file...${NC}"
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
else
  echo -e "${YELLOW}No .env file found. Using environment variables only.${NC}"
fi

# Check required vars
for var in FIREFOX_EXT_ID FIREFOX_API_KEY FIREFOX_API_SECRET; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}Error: $var is not set${NC}"
    echo -e "${YELLOW}Add it to .env or export it in your shell.${NC}"
    exit 1
  fi
done

# Warn about missing optional build vars
for var in PLASMO_PUBLIC_TRANSAK_API_KEY PLASMO_PUBLIC_TRANSAK_TOP_TIER_API_KEY PLASMO_PUBLIC_GA_MEASUREMENT_ID PLASMO_PUBLIC_GA_API_SECRET; do
  if [ -z "${!var}" ]; then
    echo -e "${YELLOW}Warning: $var is not set${NC}"
  fi
done

cd "$PROJECT_ROOT"

# Build
echo -e "${GREEN}Building Firefox extension...${NC}"
yarn build:firefox

if [ ! -d "build/firefox-mv3-prod" ]; then
  echo -e "${RED}Error: Build failed - build/firefox-mv3-prod/ not found${NC}"
  exit 1
fi

# Package zip with manifest.json at root
echo -e "${GREEN}Packaging into zip...${NC}"
rm -f build/firefox-mv3-prod.zip
(cd build/firefox-mv3-prod && zip -r ../firefox-mv3-prod.zip .)

echo -e "${GREEN}Build successful!${NC}"

# Submit via web-ext
if ! command -v web-ext &> /dev/null; then
  echo -e "${RED}Error: web-ext is not installed. Install it with:${NC}"
  echo "  npm install -g web-ext"
  exit 1
fi

echo -e "${GREEN}Submitting to Firefox Add-ons via web-ext...${NC}"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

unzip -q "build/firefox-mv3-prod.zip" -d "$TEMP_DIR"

# Inject extension ID into manifest.json if needed
if command -v jq &> /dev/null; then
  if ! jq -e '.browser_specific_settings.gecko.id' "$TEMP_DIR/manifest.json" > /dev/null 2>&1; then
    jq --arg extId "$FIREFOX_EXT_ID" '. + {browser_specific_settings: {gecko: {id: $extId}}}' \
      "$TEMP_DIR/manifest.json" > "$TEMP_DIR/manifest.json.tmp" && mv "$TEMP_DIR/manifest.json.tmp" "$TEMP_DIR/manifest.json"
    echo -e "${GREEN}Injected extension ID into manifest.json${NC}"
  fi
fi

export WEB_EXT_API_KEY="$FIREFOX_API_KEY"
export WEB_EXT_API_SECRET="$FIREFOX_API_SECRET"

web-ext sign --source-dir="$TEMP_DIR" --channel=listed

echo -e "${GREEN}Submission successful!${NC}"
