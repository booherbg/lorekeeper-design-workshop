# Lorekeeper — Project Genesis

## The idea

You're building **Lorekeeper**, a tool for creating consistent, richly-textured stories set in worlds you design.

Think of it like this: you're the architect of a world. You decide who lives there, what the places look and feel like, and what history has shaped it all. Then, when you want a story — a bedtime tale, an adventure, a quiet moment — the system weaves one from the threads you've laid down. Every story feels like it belongs because it draws from the same well of characters, places, and lore.

## What the system needs to do

### World-building

The system needs to know about the **people** in your stories, the **places** they inhabit, and the **texture** that makes the world feel alive.

A character might have a personality, a quirk, a signature phrase, a relationship to a place or another character. A location might have a mood, a season, a time of day when it feels most itself, a detail that makes it specific — the creaky third step, the smell of pine, the way the light comes through the window at dusk.

Over time, the world accumulates texture — recurring jokes, artifacts, history, bits of shared memory — that makes each new story feel connected to the ones that came before.

How you model this is up to you. Some people want a rich taxonomy; others want something flat and simple. The design phase is where you'll figure out what feels right for your world.

### Story generation

Given a world with enough context — some characters, a place, some texture — the system generates a story. The story should:

- Feel consistent with the world: characters act like themselves, places feel familiar
- Use the descriptive language you've provided as anchors for voice and tone
- Reference existing lore naturally — callbacks to previous stories, recurring details, shared history
- Be appropriate for the context (a bedtime story has a different shape than an adventure)

Stories are **saved to your collection** — you can browse them, re-read favorites, and watch your world's narrative history grow over time. Each story becomes part of the record, and the lore it generates feeds forward into future stories.

### Lore generation

After a story is generated, the system also produces a handful of **lore artifacts** — small pieces of world texture that emerged from the story. Maybe a character said something memorable, or a new detail about a place was invented, or an object appeared that could become significant.

The user reviews these artifacts and decides which ones to **keep**. Kept artifacts become part of the world's lore, available to future stories. This is how the world grows organically — each story potentially enriching the world for the next one.

### World-building advisor

An AI advisor (via MCP) helps with world-building. It can:

- Ask probing questions about your world's texture: "What does magic sound like here? Is it quiet and internal, or loud and dramatic?"
- Suggest connections you might not have seen: "Your blacksmith and your librarian both lost someone — could that be a shared history?"
- Check consistency as the world grows: "You said the forest is always misty, but this new location describes it as sun-drenched. Which is right?"
- Help flesh out thin descriptions: "This character has a name and a job, but what makes them *them*?"

The advisor is a collaborator, not a gatekeeper. It offers suggestions; you decide what sticks.

The app should include a setup page that helps users connect Claude Code (or another MCP-compatible tool) to the MCP server, with instructions and a skill file they can use.

### Session report

When you're done building (or at any point along the way), you can ask the agent to generate an HTML report of your build — the prompts you used, the decisions you made, the arc of how your project came together. The agent reads your session summaries, checkpoint logs, and git history and produces a single shareable HTML file. This is both a personal record and something you can share with others to compare approaches.

## What's out of scope (for now)

The base project is intentionally simple:

- **No authentication.** This runs locally, for you.
- **No external database.** SQLite keeps everything in a file — no setup, no server.
- **No complex frontend framework.** Server-rendered HTML keeps the focus on the world, not the tooling.
- **No deployment.** This runs on your machine.

These constraints aren't limitations — they're choices that keep the project focused on what matters: the design loop and the world you're building.

## Stretch goals

Once the base project works, you might want to push further. Some directions to explore:

- **Authentication** — add user accounts so multiple people can have their own worlds
- **Service tokens** — secure API access for external integrations
- **Community portal** — share worlds and stories with others, browse what people have built
- **Asset generation** — character portraits, location art, maps
- **Game mechanics** — RPG-style stats, inventory, dice rolls woven into stories
- **Story arcs** — multi-part stories that build on each other, with branching paths
- **Additional workflows** — character relationship mapping, timeline visualization, world history generation
- **Story re-weaving** — retrofit older stories with new lore, updating them to reflect the world as it's grown
- **Storybook publishing** — generate a beautiful HTML storybook from your collection and publish it to GitHub Pages. Fork the repo, generate stories, and share your world with anyone via a personal URL.
- **Deployment** — put it on the internet via Vercel, Railway, or similar. Or keep it local and just publish the storybook.

Each stretch goal follows the same process: design doc first, then spec, then build plan, then implement. By the time you get here, you'll know the loop.

## How to use this document

This is your creative brief — the "what" and "why" of the project. In the next phase, you'll work with your AI advisor to turn these ideas into a technical design: what entities you need, how they relate, what the API looks like, what pages the user sees.

Don't try to solve everything now. The design phase will surface the hard questions. That's the whole point.
