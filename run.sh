#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Starting PressScript (Docker) at http://localhost:3000"
exec docker compose up --build
