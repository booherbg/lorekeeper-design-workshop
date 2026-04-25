# Lorekeeper — Workshop Assignment

The best bedtime stories are as interesting as they are consistent. The dragon remembers her promise from last Tuesday. The lighthouse keeper always smells like cinnamon and salt. The world feels real because it's *consistent* — the same characters, the same places, the same little details, story after story.

**Lorekeeper** is a story generator that works this way. You build a world — characters with quirks, places with moods, lore that accumulates over time — and when you generate a story, it draws from everything you've created. The best details from each story feed back into the world as new lore, making the next one richer.

Bedtime stories are the default, but the design is yours. Build it right and this could just as easily be a D&D campaign lore generator, a sci-fi world bible, or whatever your imagination calls for. It all depends on how you design it.

## What this assignment is really about

This isn't just about building an app. You're learning a **process** — and practicing it on a project that's creative, self-contained, and fun.

### What you'll learn

- **Design before code.** How to turn a vague idea into a concrete design by asking the right questions — and how an AI collaborator surfaces the questions you didn't think to ask.
- **Specs as a safety net.** How writing a technical spec catches design gaps before they become bugs. This is where the biggest "aha" moments happen.
- **Build planning.** How to slice a project into vertical increments that each deliver working software you can see and test.
- **Session-based building.** How to work in focused sessions with clean handoffs, so you (and the agent) can pick up exactly where you left off.
- **Test-first development.** How writing the test before the code changes the way you think about what you're building.

### How the assignment works

Everyone starts from the same creative brief (the GENESYS), but you'll each make your own design decisions. Your agent guides you through the process interactively — one decision at a time. By the end, you'll have a working story generator, a complete set of design docs and specs, and a log of every prompt and decision you made along the way.

When we reconvene, we'll review what everyone built, compare our designs, and walk through our session logs to see where the process helped — and where it surprised us.

## Prerequisites

- **Git** — to clone the repo and track your work
- **Claude Code** — your AI collaborator for the assignment. Either the desktop app or CLI works:
  - **Desktop app:** Download from [claude.ai/code](https://claude.ai/code)
  - **CLI:** `npm install -g @anthropic-ai/claude-code` (requires Node.js — see below if you don't have it yet)

That's it for now. You'll install Node.js and other development tools later, when the agent guides you through the implementation phase.

## Quick start

```bash
# Fork the repo on GitHub (so you have your own copy), then:
git clone <your-fork-url>
cd lorekeeper

# Start your first session
./start.sh
```

The agent will welcome you, ask about your experience, and guide you through the design process. Just follow along and have a conversation.

**Windows users or if `start.sh` doesn't work:** Open Claude Code in the project folder and say:

> Read docs/PROMPTS/CURRENT-HANDOFF-PROMPT.md and let's get to work.

That does the same thing as the start script.

**Model tip:** You can switch models anytime with `/model claude-opus-4-6` (great for design work — strong reasoning, lower cost) or `/model claude-sonnet-4-6` (faster, good for implementation). The agent will suggest when to switch.

## How it works

The project moves through six phases:

1. **Onboarding** — The agent learns about you and tailors its communication
2. **Design** — You read the project brief together and make design decisions interactively
3. **Spec** — You convert your design into technical specifications
4. **Build Plan** — You slice the work into ordered, testable increments
5. **Implement** — You build it session by session, with handoffs between sessions
6. **Activate** — You connect the MCP advisor, build your world, and generate stories

Each phase builds on the last. The agent guides you through transitions and catches things you might miss.

## Sessions

Work happens in **sessions**. Each session:

- Picks up where the last one left off (via a handoff prompt)
- Ends with a summary, decisions log, and handoff for next time
- Creates a commit at natural stopping points

To start a session: `./start.sh`

To end a session: tell the agent "let's wrap up" or "session done"

## Project structure

```
docs/
├── DESIGN/
│   ├── 01-GENESYS.md              # The creative brief — your starting point
│   └── 02-TECH-STACK.md           # Recommended stack (you can change this)
├── SPECS/                          # Technical specs (you'll create these)
└── PROMPTS/
    ├── 001.md                      # Checkpoint log (prompt-by-prompt audit trail)
    ├── SESSION-SUMMARIES/          # One file per session
    └── CURRENT-HANDOFF-PROMPT.md   # Used by start.sh
CLAUDE.md                           # Agent instructions (the tutor brain)
start.sh                            # Session launcher
```

## Build report

At any point, you can ask the agent to generate an HTML report of your build process. Just say "generate a build report" and it'll read your session summaries, checkpoint logs, and git history to produce a single shareable HTML file. Great for reviewing what you built and comparing approaches with others.

## Bug reporting with screenshots

When something looks wrong in your running app, screenshot it and paste directly into the chat:

- **Mac:** Cmd+Shift+4 (select area) or Cmd+Shift+5 (screenshot options)
- **Windows:** Win+Shift+S (Snipping Tool)

The agent can look at your screenshot and help debug visual issues.

## Installing Node.js (when you need it)

You won't need Node.js until the implementation phase. When the time comes, the agent will guide you. But if you want to get ahead:

**Mac (via Homebrew):**
```bash
brew install node
```

**Mac/Linux (via nvm — recommended):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
```

**Windows (via installer):**
Download from [nodejs.org](https://nodejs.org/) — choose the LTS version.

**Windows (via nvm-windows):**
Download from [github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows/releases)

Verify it works:
```bash
node --version   # should show v20+ or v22+
npm --version    # should show 10+
```

## MCP setup (Phase 6)

The app doesn't call any AI APIs directly — there are no API keys to manage. Instead, your app exposes an MCP server, and **Claude Code connects to it**. This lets Claude read your world data, generate stories, check consistency, and suggest lore — all through the same agent you used to build the project.

When you reach the Activate phase, the agent will help you connect:
- **Claude Code** — add to your project's `.claude/settings.json`
- **Cursor** — add to `.cursor/mcp.json`
- **Other MCP-compatible tools** — follow their MCP configuration docs

## Stretch goals

Once the base project works, you can extend it:

- Authentication (user accounts, sessions)
- Service tokens for API access
- Community portal (share worlds and stories)
- Asset generation (character portraits, maps)
- Game mechanics (RPG stats, dice rolls in stories)
- Story arcs (multi-part branching narratives)
- Story re-weaving (retrofit old stories with new lore)
- Storybook publishing (see below)
- Deployment (Vercel, Railway, etc.)

Each stretch goal follows the same loop: design → spec → build plan → implement.

## Publishing your storybook

One of the coolest stretch goals: generate a beautiful HTML storybook from your story collection and publish it to GitHub Pages. Since you forked the repo, you already have a GitHub repository — the agent can help you:

1. Generate HTML pages for each story in your collection
2. Push them to a `gh-pages` branch
3. Enable GitHub Pages in your repo settings

The result: a personal URL (like `yourusername.github.io/lorekeeper`) where anyone can read the stories from your world. Share it with friends, read it on your phone, or just enjoy having a real artifact from your creative work.
