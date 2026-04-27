---
marp: true
theme: uncover
class: invert
paginate: true
style: |
  section { font-size: 28px; }
  h1 { font-size: 48px; }
  h2 { font-size: 36px; }
  table { font-size: 24px; }
---

# AI-Assisted Design & Build
### A 24-Hour Workshop Sprint

Lorekeeper: a world-building story generator
Built with Claude Code + MCP

---

## The Assignment

Design, spec, plan, and build a full application in one day.

**Design** → **Spec** → **Build Plan** → **Implement** → **Activate**

The AI is a collaborator, not a code generator.
The process is the deliverable.

---

## What is Lorekeeper?

A tool where you build worlds and AI writes stories grounded in them.

**Worlds → Characters & Locations → Stories → Lore**

- Lore feeds back into future stories
- 22 MCP tools for AI interaction
- Web UI for browsing and editing
- Advisor skill file turns tools into a collaborator

---

## Session 1: Design Sprint (~1 hour)

Onboarding through build plan — all pre-implementation phases.

- Core data model: simplicity over structure
- Freeform text, no structured fields — let the AI parse
- 4 spec documents written and audited
- 7 vertical slices planned

---

## Session 2: Spec Hardening (~45 min)

Making specs bulletproof for an unattended overnight build.

- Testing strategy: service layer + `.inject()`, no E2E
- Dropped JSON API — MCP calls services directly
- 3 audit passes until clean
- Easter egg planted

---

## Session 3: Overnight Build

Unattended. Test-first. All 7 slices.

| Slices 1-3 | World, Character, Location CRUD |
|---|---|
| **Slice 4** | Stories + join tables |
| **Slice 5** | Lore artifacts + lifecycle |
| **Slice 6** | World context + generation UX |
| **Slice 7** | MCP server + setup page |

**136 tests passing.**

---

## Sessions 4-5: Review & Activate

**Review**: Dark mode UI, dual MCP transport, tabbed setup page

**MCP deep dive**: Debugged Claude Code config, discovered
`claude mcp add` CLI — not `settings.json`

**Install script**: `curl -s localhost:3000/setup/install | bash`
Universal skill file format across Claude Code + Cursor

---

## MCP: Tools vs. Advisor

**MCP alone** — 22 raw tools, you direct every step

**MCP + Advisor skill** — AI knows the workflow:
- Loads world context at session start
- Generates stories grounded in lore
- Extracts artifacts automatically
- Checks consistency proactively

The skill file is the difference between a tool and a collaborator.

---

## Demo

```bash
curl -s http://localhost:3000/setup/install | bash
```

1. Create a world
2. Build characters and locations
3. Generate a story → review lore
4. Generate another — watch lore compound

**Sessions:** `docs/sessions.html`
**Setup:** `localhost:3000/setup`
