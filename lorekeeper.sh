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

printf '  %bStarting a new session...%b\n\n' "$DIM" "$RESET"
printf '  %b%bTip:%b Use %b/lorekeeper-advisor%b to activate the advisor skill.\n' "$MAGENTA" "$BOLD" "$RESET" "$CYAN" "$RESET"
printf '  %bThen try: "I want to build a world set in a coastal town where magic is fading."%b\n\n' "$DIM" "$RESET"

exec claude --prompt "You are connected to the Lorekeeper MCP server. Run /lorekeeper-advisor to activate the world-building advisor, then greet the user warmly and ask what kind of world they'd like to build today."
