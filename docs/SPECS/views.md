# Views Spec

## Layout

All pages share a common layout with:

- **Navigation bar**: App name ("Lorekeeper"), link to worlds list
- **Breadcrumbs**: World > Section > Item (contextual, shows hierarchy)
- **Content area**: The page-specific content below

Styling is Tailwind CSS. Clean, readable, nothing fancy. The content is the star — stories and world-building text need room to breathe.

## Pages

### Worlds List — `/worlds`

The landing page. Shows all worlds as cards.

**Data needed:** All worlds with counts (characters, locations, stories).

**Each world card shows:**
- Name
- Description (truncated to ~150 chars)
- Counts: N characters, N locations, N stories
- Link to world detail

**Actions:**
- Create new world (button → `/worlds/new`)
- Click a world card → world detail

### World Form — `/worlds/new`, `/worlds/:id/edit`

Simple form: name (text input), description (textarea, optional).

**Actions:**
- Save → creates/updates, redirects to world detail
- Cancel → back to list (new) or detail (edit)

### World Detail — `/worlds/:id`

The dashboard for a single world. Overview and navigation into its contents.

**Data needed:** World with counts for characters, locations, stories, kept lore.

**Shows:**
- World name and description
- Section links with counts:
  - Characters (N) → character list
  - Locations (N) → location list
  - Stories (N) → story list
  - Lore (N kept) → lore list

**Actions:**
- Edit world (button → edit form)
- Delete world (button, confirmation dialog — "This deletes everything in this world")
- Navigate to any section

### Character List — `/worlds/:worldId/characters`

**Data needed:** All characters in the world.

**Each character shows:**
- Name
- Description (truncated to ~150 chars)

**Actions:**
- Create new character (button → new form)
- Click a character → character detail

### Character Form — `/worlds/:worldId/characters/new`, `/worlds/:worldId/characters/:id/edit`

Form: name (text input), description (textarea, required).

Description textarea should be generous — this is where the user puts personality, appearance, quirks, relationships. Placeholder text to guide: "Describe this character — personality, appearance, quirks, relationships, anything that makes them who they are."

**Actions:**
- Save → redirect to detail
- Cancel → back to list (new) or detail (edit)

### Character Detail — `/worlds/:worldId/characters/:id`

**Data needed:** Character, stories featuring them (via StoryCharacter), lore artifacts about them.

**Shows:**
- Name
- Full description (rendered with line breaks preserved)
- **Stories featuring this character** — list of story titles with links, showing date. Empty state: "No stories yet."
- **Lore about this character** — kept lore artifacts with their content. Empty state: "No lore yet."

**Actions:**
- Edit character (button → edit form)
- Delete character (button, confirmation)

### Location List — `/worlds/:worldId/locations`

Same pattern as character list.

**Data needed:** All locations in the world.

**Each location shows:**
- Name
- Description (truncated to ~150 chars)

**Actions:**
- Create new location (button → new form)
- Click a location → location detail

### Location Form — `/worlds/:worldId/locations/new`, `/worlds/:worldId/locations/:id/edit`

Form: name (text input), description (textarea, required).

Placeholder text: "Describe this place — its mood, atmosphere, sensory details, what makes it feel alive."

**Actions:**
- Save → redirect to detail
- Cancel → back to list (new) or detail (edit)

### Location Detail — `/worlds/:worldId/locations/:id`

Same structure as character detail, scoped to location.

**Data needed:** Location, stories set here (via StoryLocation), lore artifacts about this place.

**Shows:**
- Name
- Full description
- **Stories set here** — list of story titles with links. Empty state: "No stories yet."
- **Lore about this place** — kept lore artifacts. Empty state: "No lore yet."

**Actions:**
- Edit location (button → edit form)
- Delete location (button, confirmation)

### Story List — `/worlds/:worldId/stories`

**Data needed:** All stories in the world, ordered by createdAt descending (newest first).

**Each story shows:**
- Title
- Content preview (first ~200 chars of content)
- Date
- Characters featured (names as tags/chips)

**Actions:**
- Click a story → story detail

No "create story" button in the web UI — stories are generated through MCP.

### Story Detail — `/worlds/:worldId/stories/:id`

The reading experience. This page should feel good — the story text is the centerpiece.

**Data needed:** Story with linked characters, locations, and lore artifacts generated from this story.

**Shows:**
- Title
- Date
- Prompt (what the user asked for, shown in a subtle callout)
- Full story content (rendered with line breaks/paragraphs preserved)
- **Characters in this story** — linked names
- **Locations in this story** — linked names
- **Lore artifacts** — each artifact shows content, status (pending/kept/discarded), and linked character/location if any

**Actions:**
- Delete story (button, confirmation — "This also removes lore artifacts from this story")
- For each lore artifact: Keep / Discard buttons (inline status update)

### Lore List — `/worlds/:worldId/lore`

Browse all lore artifacts in the world.

**Data needed:** All lore artifacts in the world. Filterable by status.

**Each artifact shows:**
- Content
- Status badge (pending / kept / discarded)
- Source story (linked title)
- Connected character or location (linked name, if any)

**Filters:**
- Status: All / Pending / Kept / Discarded (tabs or buttons, default to All)

**Actions:**
- Keep / Discard buttons on each artifact (inline status update)
- Click source story → story detail
- Click character/location → their detail page

### The Lorekeeper's Inscription — `/lorekeeper`

A hidden page — not linked from anywhere in the navigation. Only found by those who think to look.

**Styled differently** from the rest of the app: darker palette, serif font for body text, centered narrow column. Feels like opening an old book.

**Shows:**

- A thematic header: "The Lorekeeper's Inscription"
- An atmospheric opening paragraph establishing the Lorekeeper as an ancient, enigmatic figure who watches over worlds and remembers their tales
- **Worlds Under Watch** — each world rendered as a narrative entry: "The realm of [name], first inscribed on [createdAt formatted as prose — 'the twenty-seventh of April'], home to [N] souls, [N] sacred places, and [N] tales woven from its threads." If a world has zero stories: "...awaiting its first tale."
- If no worlds exist: "The Lorekeeper watches. The pages are empty. No worlds have yet been dreamed into being."
- At the very bottom, in small, muted text: "This Lorekeeper was forged by a craftsman and a whispering voice, through [N] sessions of careful work." — where N is the count of Markdown files in `docs/PROMPTS/SESSION-SUMMARIES/`. If the directory is empty or missing, omit this line.

**Data needed:** All worlds with counts (characters, locations, stories). Count of session summary files from the filesystem.

### MCP Setup — `/setup`

A standalone page (not world-scoped) with instructions for connecting Claude Code to the MCP server.

**Shows:**
- What MCP is (one paragraph)
- Step-by-step connection instructions
- The MCP server command to add to Claude Code config
- Available tools and what they do (reference list)
- A skill file the user can install for guided world-building

This page is mostly static content. No dynamic data needed.

## Empty States

Every list page needs an empty state that guides the user:

- **No worlds:** "Create your first world to get started." + create button
- **No characters:** "This world needs people. Create your first character." + create button
- **No locations:** "Every world needs places. Create your first location." + create button
- **No stories:** Story generation guide (see Story Generation Guide section below)
- **No lore:** "Lore emerges from stories. Generate a story first, and artifacts will appear here."

## Story Generation Guide

The web UI doesn't generate stories directly — the AI does, via MCP. But users need to understand this flow. Guidance appears in two places and fades once the user has generated their first story.

### Story list empty state

When a world has zero stories, replace the empty list with a guided block:

**"Your world is waiting for its first story."**

1. **Set up the AI advisor** — connect Claude Code to Lorekeeper's MCP server (link to `/setup`)
2. **Ask for a story** — tell the advisor something like: "Tell me a bedtime story about [character] at [location]"
3. **Review and keep** — your story appears here, along with lore artifacts you can keep or discard

If characters or locations are also empty, note that too: "Tip: create some characters and locations first — they give the AI material to work with."

### World detail callout

On the world detail page, if the world has at least one character or location but zero stories, show a callout card:

**"Ready for a story?"**

"Your world has N characters and N locations. Ask your AI advisor to generate a story — it'll draw from everything you've built here."

+ Link to setup page if MCP isn't connected yet.

This callout disappears once the world has at least one story.

## Design Notes

- **Story previews** use truncated content (first ~200 chars), not a separate summary field.
- **Description rendering** preserves line breaks. Users will write multi-paragraph descriptions; collapsing them into a wall of text loses structure.
- **Confirmation dialogs** for destructive actions can be simple browser `confirm()` — no need for custom modals in base scope.
- **Lore status updates** should feel snappy — consider a small inline fetch (vanilla JS) so the user doesn't reload the page after each keep/discard. This is the one place where a bit of client-side JS adds real value.
