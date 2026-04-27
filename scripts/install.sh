#!/usr/bin/env bash
set -euo pipefail

# ─── Config --------------------------------------------------────────────────
LOREKEEPER_URL="${LOREKEEPER_URL:-http://localhost:3000}"
SKILL_ENDPOINT="$LOREKEEPER_URL/setup/skill-file"
CURSOR_SKILL_ENDPOINT="$LOREKEEPER_URL/setup/cursor-skill-file"
MCP_ENDPOINT="$LOREKEEPER_URL/mcp"

# ─── Colors & Symbols --------------------------------------------------─────
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
MAGENTA='\033[35m'
RED='\033[31m'
WHITE='\033[97m'

CHECK="${GREEN}[ok]${RESET}"
ARROW="${CYAN} > ${RESET}"
WARN="${YELLOW}[!]${RESET}"
FAIL="${RED}[x]${RESET}"
STAR="${MAGENTA} * ${RESET}"

# ─── Helpers --------------------------------------------------───────────────
print_line() { printf '%b\n' "$1"; }
print_step() { printf '  %b  %b\n' "$ARROW" "$1"; }
print_ok() { printf '  %b  %b\n' "$CHECK" "$1"; }
print_warn() { printf '  %b  %b\n' "$WARN" "$1"; }
print_fail() { printf '  %b  %b\n' "$FAIL" "$1"; }
print_blank() { printf '\n'; }

ask_choice() {
  local prompt="$1"
  shift
  local options=("$@")
  local count=${#options[@]}

  print_blank
  printf '  %b%b%b\n' "$BOLD" "$prompt" "$RESET"
  print_blank
  for i in "${!options[@]}"; do
    printf '    %b[%d]%b  %b\n' "$CYAN" $((i + 1)) "$RESET" "${options[$i]}"
  done
  print_blank
  while true; do
    printf '  %b>%b ' "$CYAN" "$RESET"
    read -r choice < /dev/tty
    if [[ "$choice" =~ ^[1-9][0-9]*$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "$count" ]; then
      CHOICE=$((choice - 1))
      return
    fi
    printf '  %b  Enter a number between 1 and %d\n' "$WARN" "$count"
  done
}

# ─── Banner --------------------------------------------------────────────────
clear
printf '%b' "$CYAN"
cat << 'BANNER'

    +--------------------------------------------------+
    |                                                  |
    |    _    ___  ___ ___                             |
    |   | |  / _ \| _ \ __|                            |
    |   | |_| (_) |   / _|                             |
    |   |____\___/|_|_\___|                            |
    |                                                  |
    |         K  E  E  P  E  R                         |
    |                                                  |
    +--------------------------------------------------+

BANNER
printf '%b' "$RESET"

print_line "  ${DIM}World-building story generator · MCP-powered${RESET}"
print_blank
print_line "  ${WHITE}${BOLD}What this installer does:${RESET}"
print_blank
print_line "    ${STAR}  Connects your AI assistant to Lorekeeper via MCP"
print_line "    ${STAR}  Installs the Lorekeeper Advisor skill file"
print_line "    ${STAR}  Creates a start script to launch workshop sessions"
print_blank
print_line "  ${DIM}--------------------------------------------------${RESET}"

# ─── Preflight --------------------------------------------------─────────────
print_blank
print_line "  ${WHITE}${BOLD}Preflight checks${RESET}"
print_blank

# Check server is reachable
if curl -sf "$LOREKEEPER_URL" > /dev/null 2>&1; then
  print_ok "Lorekeeper server reachable at ${CYAN}$LOREKEEPER_URL${RESET}"
else
  print_fail "Cannot reach Lorekeeper at ${CYAN}$LOREKEEPER_URL${RESET}"
  print_line "    ${DIM}Make sure the server is running: npm run dev${RESET}"
  print_blank
  exit 1
fi

# Check curl
if command -v curl &> /dev/null; then
  print_ok "curl available"
else
  print_fail "curl is required but not installed"
  exit 1
fi

# ─── Choose Client --------------------------------------------------─────────
ask_choice "Which AI assistant will you use?" \
  "Claude Code ${DIM}(CLI / terminal)${RESET}" \
  "Cursor ${DIM}(editor / IDE)${RESET}"
CLIENT_CHOICE=$CHOICE

if [ "$CLIENT_CHOICE" -eq 0 ]; then
  CLIENT="claude"
  if command -v claude &> /dev/null; then
    print_ok "Claude Code CLI found"
  else
    print_warn "Claude Code CLI not found — install it first"
    print_line "    ${DIM}https://claude.ai/download${RESET}"
    print_blank
    exit 1
  fi
else
  CLIENT="cursor"
fi

# ─── Choose Scope --------------------------------------------------──────────
ask_choice "Installation scope?" \
  "Global ${DIM}(available in all projects)${RESET}" \
  "Local ${DIM}(creates a fresh workshop directory)${RESET}"
SCOPE_CHOICE=$CHOICE

if [ "$SCOPE_CHOICE" -eq 0 ]; then
  SCOPE="global"
else
  SCOPE="local"
fi

# ─── Determine working directory ──────────────────────────────────────────────
if [ "$SCOPE" = "local" ]; then
  WORKSHOP_DIR="$(pwd)/lorekeeper-workshop"
  if [ -d "$WORKSHOP_DIR" ]; then
    print_warn "Directory ${CYAN}lorekeeper-workshop/${RESET} already exists"
    ask_choice "What would you like to do?" \
      "Use existing directory" \
      "Exit (rename or remove it first)"
    if [ "$CHOICE" -eq 1 ]; then
      print_blank
      exit 0
    fi
  else
    mkdir -p "$WORKSHOP_DIR"
    print_ok "Created ${CYAN}lorekeeper-workshop/${RESET}"
  fi
fi

# ─── Install MCP --------------------------------------------------──────────
print_blank
print_line "  ${WHITE}${BOLD}Setting up MCP connection${RESET}"
print_blank

if [ "$CLIENT" = "claude" ]; then
  if [ "$SCOPE" = "global" ]; then
    if claude mcp add --transport http lorekeeper --scope user "$MCP_ENDPOINT" 2>/dev/null; then
      print_ok "MCP server registered globally ${DIM}(user scope)${RESET}"
    else
      print_ok "MCP server already registered globally ${DIM}(user scope)${RESET}"
    fi
    print_step "Verify with ${CYAN}/mcp${RESET} inside Claude Code after restarting"
  else
    # Local: create .mcp.json in workshop dir
    cat > "$WORKSHOP_DIR/.mcp.json" << EOF
{
  "mcpServers": {
    "lorekeeper": {
      "type": "http",
      "url": "$MCP_ENDPOINT"
    }
  }
}
EOF
    print_ok "Created ${CYAN}lorekeeper-workshop/.mcp.json${RESET}"
  fi

elif [ "$CLIENT" = "cursor" ]; then
  if [ "$SCOPE" = "global" ]; then
    # Cursor global: ~/.cursor/mcp.json
    CURSOR_MCP_DIR="$HOME/.cursor"
    CURSOR_MCP_FILE="$CURSOR_MCP_DIR/mcp.json"
    mkdir -p "$CURSOR_MCP_DIR"

    if [ -f "$CURSOR_MCP_FILE" ]; then
      # Merge into existing file — add lorekeeper to mcpServers
      if command -v python3 &> /dev/null; then
        python3 -c "
import json, sys
try:
    with open('$CURSOR_MCP_FILE') as f:
        data = json.load(f)
except (json.JSONDecodeError, FileNotFoundError):
    data = {}
data.setdefault('mcpServers', {})
data['mcpServers']['lorekeeper'] = {'url': '$MCP_ENDPOINT'}
with open('$CURSOR_MCP_FILE', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"
        print_ok "Added lorekeeper to ${CYAN}~/.cursor/mcp.json${RESET}"
      else
        print_warn "Cannot merge — python3 not found. Add manually to ${CYAN}~/.cursor/mcp.json${RESET}"
      fi
    else
      cat > "$CURSOR_MCP_FILE" << EOF
{
  "mcpServers": {
    "lorekeeper": {
      "url": "$MCP_ENDPOINT"
    }
  }
}
EOF
      print_ok "Created ${CYAN}~/.cursor/mcp.json${RESET}"
    fi
  else
    # Local: .cursor/mcp.json in workshop dir
    mkdir -p "$WORKSHOP_DIR/.cursor"
    cat > "$WORKSHOP_DIR/.cursor/mcp.json" << EOF
{
  "mcpServers": {
    "lorekeeper": {
      "url": "$MCP_ENDPOINT"
    }
  }
}
EOF
    print_ok "Created ${CYAN}lorekeeper-workshop/.cursor/mcp.json${RESET}"
  fi
fi

# ─── Install Skill File --------------------------------------------------───
print_blank
print_line "  ${WHITE}${BOLD}Installing skill file${RESET}"
print_blank

if [ "$CLIENT" = "claude" ]; then
  SKILL_DIR="$HOME/.claude/skills/lorekeeper-advisor"
  if [ "$SCOPE" = "local" ]; then
    SKILL_DIR="$WORKSHOP_DIR/.claude/skills/lorekeeper-advisor"
  fi
  mkdir -p "$SKILL_DIR"
  curl -sf "$SKILL_ENDPOINT" -o "$SKILL_DIR/SKILL.md"
  print_ok "Installed to ${CYAN}${SKILL_DIR/$HOME/\~}/SKILL.md${RESET}"
  print_step "Invoke with ${CYAN}/lorekeeper-advisor${RESET}"

elif [ "$CLIENT" = "cursor" ]; then
  if [ "$SCOPE" = "global" ]; then
    SKILL_DIR="$HOME/.cursor/skills"
  else
    SKILL_DIR="$WORKSHOP_DIR/.cursor/skills"
  fi
  mkdir -p "$SKILL_DIR"
  curl -sf "$CURSOR_SKILL_ENDPOINT" -o "$SKILL_DIR/lorekeeper-advisor.md"
  print_ok "Installed to ${CYAN}${SKILL_DIR/$HOME/\~}/lorekeeper-advisor.md${RESET}"
  print_step "Cursor will auto-discover the skill"
fi

# ─── Create Start Script --------------------------------------------------──
print_blank
print_line "  ${WHITE}${BOLD}Creating start script${RESET}"
print_blank

if [ "$SCOPE" = "local" ]; then
  START_DIR="$WORKSHOP_DIR"
else
  START_DIR="$(pwd)"
fi

if [ "$CLIENT" = "claude" ]; then
  cat > "$START_DIR/lorekeeper.sh" << 'STARTSCRIPT'
#!/usr/bin/env bash

CYAN='\033[36m'
MAGENTA='\033[35m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'
WHITE='\033[97m'

clear
printf '%b' "$CYAN"
cat << 'ART'

    +--------------------------------------------+
    |                                            |
    |     *  L O R E K E E P E R  *              |
    |                                            |
    |     World-Building Workshop                |
    |                                            |
    +--------------------------------------------+

ART
printf '%b' "$RESET"

printf '  %b%bTip:%b Use %b/lorekeeper-advisor%b to activate the advisor skill.\n' "$MAGENTA" "$BOLD" "$RESET" "$CYAN" "$RESET"
printf '  %bThen try: "I want to build a world set in a coastal town where magic is fading."%b\n\n' "$DIM" "$RESET"

exec claude
STARTSCRIPT
  chmod +x "$START_DIR/lorekeeper.sh"
  print_ok "Created ${CYAN}lorekeeper.sh${RESET}"

elif [ "$CLIENT" = "cursor" ]; then
  cat > "$START_DIR/lorekeeper.sh" << 'STARTSCRIPT'
#!/usr/bin/env bash

CYAN='\033[36m'
MAGENTA='\033[35m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

clear
printf '%b' "$CYAN"
cat << 'ART'

    +--------------------------------------------+
    |                                            |
    |     *  L O R E K E E P E R  *              |
    |                                            |
    |     World-Building Workshop                |
    |                                            |
    +--------------------------------------------+

ART
printf '%b' "$RESET"

printf '  %bReady to go!%b\n\n' "$DIM" "$RESET"
printf '  %b%bTo start:%b Open this folder in Cursor, then ask the agent:%b\n' "$MAGENTA" "$BOLD" "$RESET" "$RESET"
printf '  %b"I want to build a world set in a coastal town where magic is fading."%b\n\n' "$DIM" "$RESET"
printf '  %bThe Lorekeeper Advisor skill will activate automatically.%b\n\n' "$DIM" "$RESET"

if [ -n "$1" ]; then
  exec cursor "$1"
else
  exec cursor .
fi
STARTSCRIPT
  chmod +x "$START_DIR/lorekeeper.sh"
  print_ok "Created ${CYAN}lorekeeper.sh${RESET}"
fi

# ─── Summary --------------------------------------------------──────────────
print_blank
print_line "  ${DIM}--------------------------------------------------${RESET}"
print_blank
print_line "  ${GREEN}${BOLD}Setup complete!${RESET}"
print_blank

print_line "  ${WHITE}${BOLD}What was installed:${RESET}"
print_blank

if [ "$CLIENT" = "claude" ]; then
  if [ "$SCOPE" = "global" ]; then
    print_line "    ${CHECK}  MCP connection ${DIM}(global — available in all projects)${RESET}"
    print_line "    ${CHECK}  Advisor skill  ${DIM}(~/.claude/skills/lorekeeper-advisor/)${RESET}"
    print_line "    ${CHECK}  Start script   ${DIM}(./lorekeeper.sh)${RESET}"
  else
    print_line "    ${CHECK}  MCP connection ${DIM}(lorekeeper-workshop/.mcp.json)${RESET}"
    print_line "    ${CHECK}  Advisor skill  ${DIM}(lorekeeper-workshop/.claude/skills/)${RESET}"
    print_line "    ${CHECK}  Start script   ${DIM}(lorekeeper-workshop/lorekeeper.sh)${RESET}"
  fi
elif [ "$CLIENT" = "cursor" ]; then
  if [ "$SCOPE" = "global" ]; then
    print_line "    ${CHECK}  MCP connection ${DIM}(~/.cursor/mcp.json)${RESET}"
    print_line "    ${CHECK}  Advisor skill  ${DIM}(~/.cursor/skills/)${RESET}"
    print_line "    ${CHECK}  Start script   ${DIM}(./lorekeeper.sh)${RESET}"
  else
    print_line "    ${CHECK}  MCP connection ${DIM}(lorekeeper-workshop/.cursor/mcp.json)${RESET}"
    print_line "    ${CHECK}  Advisor skill  ${DIM}(lorekeeper-workshop/.cursor/skills/)${RESET}"
    print_line "    ${CHECK}  Start script   ${DIM}(lorekeeper-workshop/lorekeeper.sh)${RESET}"
  fi
fi

print_blank
print_line "  ${WHITE}${BOLD}Next steps:${RESET}"
print_blank
print_line "    ${CYAN}1.${RESET}  Make sure Lorekeeper is running: ${CYAN}npm run dev${RESET}"

if [ "$CLIENT" = "claude" ]; then
  if [ "$SCOPE" = "local" ]; then
    print_line "    ${CYAN}2.${RESET}  ${CYAN}cd lorekeeper-workshop${RESET}"
    print_line "    ${CYAN}3.${RESET}  ${CYAN}./lorekeeper.sh${RESET}"
  else
    print_line "    ${CYAN}2.${RESET}  Restart Claude Code to load the MCP connection"
    print_line "    ${CYAN}3.${RESET}  ${CYAN}./lorekeeper.sh${RESET}"
  fi
elif [ "$CLIENT" = "cursor" ]; then
  if [ "$SCOPE" = "local" ]; then
    print_line "    ${CYAN}2.${RESET}  ${CYAN}cd lorekeeper-workshop && ./lorekeeper.sh${RESET}"
  else
    print_line "    ${CYAN}2.${RESET}  Restart Cursor to load the MCP connection"
    print_line "    ${CYAN}3.${RESET}  ${CYAN}./lorekeeper.sh${RESET}"
  fi
fi

print_blank
print_line "  ${DIM}Happy world-building!${RESET}"
print_blank
