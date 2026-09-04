#!/usr/bin/env sh
set -eu

PORT="${PORT:-9222}"
USER_DATA_DIR="${USER_DATA_DIR:-$HOME/.codex/chrome-profile}"

find_chrome() {
  for chrome_path in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$HOME/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" \
    "$HOME/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
  do
    if [ -x "$chrome_path" ]; then
      printf '%s\n' "$chrome_path"
      return
    fi
  done

  if command -v google-chrome >/dev/null 2>&1; then
    command -v google-chrome
    return
  fi

  if command -v google-chrome-stable >/dev/null 2>&1; then
    command -v google-chrome-stable
    return
  fi

  if command -v chromium >/dev/null 2>&1; then
    command -v chromium
    return
  fi

  if command -v chromium-browser >/dev/null 2>&1; then
    command -v chromium-browser
    return
  fi

  if command -v chrome.exe >/dev/null 2>&1; then
    command -v chrome.exe
    return
  fi

  if [ -f "/c/Program Files/Google/Chrome/Application/chrome.exe" ]; then
    printf '%s\n' "/c/Program Files/Google/Chrome/Application/chrome.exe"
    return
  fi

  if [ -f "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" ]; then
    printf '%s\n' "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    return
  fi

  return 1
}

CHROME_PATH="${CHROME_PATH:-$(find_chrome || true)}"

if [ -z "$CHROME_PATH" ] || [ ! -x "$CHROME_PATH" ]; then
  printf '%s\n' "Cannot find Chrome or Chromium. Please install Chrome or add it to PATH." >&2
  exit 1
fi

mkdir -p "$USER_DATA_DIR"

DEBUG_URL="http://127.0.0.1:$PORT"

printf '%s\n' "Starting Chrome DevTools browser..."
printf '%s\n' "Chrome: $CHROME_PATH"
printf '%s\n' "Debug URL: $DEBUG_URL"
printf '%s\n' "User data dir: $USER_DATA_DIR"
printf '%s\n' ""
printf '%s\n' "Codex MCP config:"
printf '%s\n' "[mcp_servers.chrome-devtools]"
printf '%s\n' 'command = "npx"'
printf '%s\n' "args = [\"-y\", \"chrome-devtools-mcp@latest\", \"--browser-url=$DEBUG_URL\", \"--no-usage-statistics\"]"

"$CHROME_PATH" \
  "--remote-debugging-port=$PORT" \
  "--user-data-dir=$USER_DATA_DIR" \
  >/dev/null 2>&1 &

printf '%s\n' ""
printf '%s\n' "Chrome started. Log in with this browser window before using MCP."
