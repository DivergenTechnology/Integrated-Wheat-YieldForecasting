#!/usr/bin/env bash
# IWCYES-IWSS Dashboard — dev server bootstrap script
# Created by /home/z/my-project/.zscripts/dev.sh
# This script ensures the Next.js dev server is running on port 3000
# so the Z.ai preview deployment platform can serve the dashboard.

set -e
cd /home/z/my-project

# Kill any existing dev server on port 3000
if lsof -ti:3000 >/dev/null 2>&1; then
  kill $(lsof -ti:3000) 2>/dev/null || true
  sleep 2
fi

# Start the dev server in the background, detached from this shell
nohup bash -c 'exec bun run dev' > /home/z/my-project/dev.log 2>&1 &
DEV_PID=$!
echo "$DEV_PID" > /home/z/my-project/.zscripts/dev.pid

# Wait for the server to be ready (max 60 seconds)
for i in $(seq 1 60); do
  if curl -s -o /dev/null --max-time 2 http://localhost:3000; then
    echo "[dev.sh] Next.js dev server is ready (PID: $DEV_PID)"
    exit 0
  fi
  sleep 1
done

echo "[dev.sh] ERROR: dev server did not start within 60 seconds" >&2
exit 1
