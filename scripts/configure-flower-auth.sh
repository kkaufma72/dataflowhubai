#!/usr/bin/env bash
set -euo pipefail

# Configure Flower auth for docker-compose and restart the Flower container.
# Usage:
#   ./scripts/configure-flower-auth.sh basic
#   ./scripts/configure-flower-auth.sh unauth-api
#
# Notes:
# - "basic" enables HTTP basic auth via FLOWER_BASIC_AUTH="user:pass".
# - "unauth-api" enables the Flower API without auth (NOT recommended).

MODE="${1:-basic}"

case "$MODE" in
  basic)
    read -r -p "Flower username: " FLOWER_USER
    read -r -s -p "Flower password: " FLOWER_PASS
    echo
    export FLOWER_BASIC_AUTH="${FLOWER_USER}:${FLOWER_PASS}"
    export FLOWER_UNAUTHENTICATED_API=""
    ;;
  unauth-api)
    export FLOWER_BASIC_AUTH=""
    export FLOWER_UNAUTHENTICATED_API="true"
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    echo "Usage: $0 basic|unauth-api" >&2
    exit 2
    ;;
esac

echo "Restarting Flower with updated env..."
docker-compose up -d --no-deps --force-recreate flower

echo "Done."
echo "Flower UI: http://localhost:5555"
