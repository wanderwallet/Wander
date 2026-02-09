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

echo -e "${GREEN}Build successful!${NC}"

# Submit via web-ext
if ! command -v web-ext &> /dev/null; then
  echo -e "${RED}Error: web-ext is not installed. Install it with:${NC}"
  echo "  npm install -g web-ext"
  exit 1
fi

echo -e "${GREEN}Submitting to Firefox Add-ons via web-ext...${NC}"

export WEB_EXT_API_KEY="$FIREFOX_API_KEY"
export WEB_EXT_API_SECRET="$FIREFOX_API_SECRET"

web-ext sign --source-dir=build/firefox-mv3-prod --channel=listed

echo -e "${GREEN}Submission successful!${NC}"
