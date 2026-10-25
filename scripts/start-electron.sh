#!/bin/sh
# Wait for Vite dev server then launch Electron
# Uses local node_modules binaries with extended timeout
./node_modules/.bin/wait-on http://localhost:5173 --timeout 60000 --interval 500
echo "[start-electron] Vite ready, launching Electron..."
./node_modules/.bin/electron .
echo "[start-electron] Electron exited."
