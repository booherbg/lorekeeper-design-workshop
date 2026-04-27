# API Endpoints Spec

## Web Routes (Server-Rendered)

All web routes return HTML via Handlebars templates. Forms use standard POST with redirects (no client-side JS required for core flows).

### Worlds

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Redirect to `/worlds` |
| GET | `/worlds` | List all worlds |
| GET | `/worlds/new` | Create world form |
| POST | `/worlds` | Create world, redirect to detail |
| GET | `/worlds/:id` | World detail — overview with counts of characters, locations, stories |
| GET | `/worlds/:id/edit` | Edit world form |
| PUT | `/worlds/:id` | Update world, redirect to detail |
| DELETE | `/worlds/:id` | Delete world, redirect to list |

### Characters

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/characters` | List characters in world |
| GET | `/worlds/:worldId/characters/new` | Create character form |
| POST | `/worlds/:worldId/characters` | Create character, redirect to detail |
| GET | `/worlds/:worldId/characters/:id` | Character detail — description, stories featuring them, lore about them |
| GET | `/worlds/:worldId/characters/:id/edit` | Edit character form |
| PUT | `/worlds/:worldId/characters/:id` | Update character, redirect to detail |
| DELETE | `/worlds/:worldId/characters/:id` | Delete character, redirect to list |

### Locations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/locations` | List locations in world |
| GET | `/worlds/:worldId/locations/new` | Create location form |
| POST | `/worlds/:worldId/locations` | Create location, redirect to detail |
| GET | `/worlds/:worldId/locations/:id` | Location detail — description, stories set here, lore about this place |
| GET | `/worlds/:worldId/locations/:id/edit` | Edit location form |
| PUT | `/worlds/:worldId/locations/:id` | Update location, redirect to detail |
| DELETE | `/worlds/:worldId/locations/:id` | Delete location, redirect to list |

### Stories

Stories are immutable once created. No edit route.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/stories` | List stories in world |
| GET | `/worlds/:worldId/stories/:id` | Story detail — full text, characters, locations, lore artifacts generated |
| DELETE | `/worlds/:worldId/stories/:id` | Delete story, redirect to list |

### Lore Artifacts

Lore artifacts are viewed in context (story detail, character detail, location detail). The only standalone action is status update.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/lore` | List all lore artifacts in world, filterable by status |
| PUT | `/worlds/:worldId/lore/:id` | Update artifact status (pending → kept or discarded) |

## API Routes (JSON)

JSON endpoints for MCP tools to call. Same data, different format.

### Worlds

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worlds` | List all worlds |
| POST | `/api/worlds` | Create world |
| GET | `/api/worlds/:id` | Get world with summary stats |
| PUT | `/api/worlds/:id` | Update world |
| DELETE | `/api/worlds/:id` | Delete world |

### Characters

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worlds/:worldId/characters` | List characters in world |
| POST | `/api/worlds/:worldId/characters` | Create character |
| GET | `/api/worlds/:worldId/characters/:id` | Get character with full description |
| PUT | `/api/worlds/:worldId/characters/:id` | Update character |
| DELETE | `/api/worlds/:worldId/characters/:id` | Delete character |

### Locations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worlds/:worldId/locations` | List locations in world |
| POST | `/api/worlds/:worldId/locations` | Create location |
| GET | `/api/worlds/:worldId/locations/:id` | Get location with full description |
| PUT | `/api/worlds/:worldId/locations/:id` | Update location |
| DELETE | `/api/worlds/:worldId/locations/:id` | Delete location |

### Stories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worlds/:worldId/stories` | List stories in world |
| POST | `/api/worlds/:worldId/stories` | Save a generated story |
| GET | `/api/worlds/:worldId/stories/:id` | Get story with characters, locations, lore |
| DELETE | `/api/worlds/:worldId/stories/:id` | Delete story |

**POST /api/worlds/:worldId/stories request shape:**

```json
{
  "title": "The Blacksmith's Bargain",
  "content": "Long-form story text...",
  "prompt": "Tell me a bedtime story about the blacksmith meeting a stranger",
  "characterIds": [1, 3],
  "locationIds": [2]
}
```

The AI generates the story content externally, then saves it through this endpoint with the full text and linked entity IDs.

### Lore Artifacts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worlds/:worldId/lore` | List lore artifacts, filterable by status |
| POST | `/api/worlds/:worldId/lore` | Create lore artifact (used after story generation) |
| PUT | `/api/worlds/:worldId/lore/:id` | Update artifact status |

**POST /api/worlds/:worldId/lore request shape:**

```json
{
  "storyId": 7,
  "content": "The blacksmith always taps his hammer three times before starting work",
  "characterId": 1,
  "locationId": null,
  "status": "pending"
}
```

### World Context

A read-only endpoint that assembles the full context for a world — everything the AI needs for generation.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/worlds/:worldId/context` | Full world context for AI consumption |

**Response shape:**

```json
{
  "world": { "id": 1, "name": "...", "description": "..." },
  "characters": [{ "id": 1, "name": "...", "description": "..." }, ...],
  "locations": [{ "id": 1, "name": "...", "description": "..." }, ...],
  "lore": [{ "id": 1, "content": "...", "characterId": 1, "locationId": null }, ...],
  "recentStories": [{ "id": 7, "title": "...", "summary": "..." }, ...]
}
```

The `lore` array only includes artifacts with status `kept`. The `recentStories` array provides recent narrative history for continuity.

## MCP Tools

These are the tools exposed via the MCP server (stdio transport). Claude Code connects to the MCP server and uses these tools to interact with the world.

### CRUD Tools

| Tool | Description |
|------|-------------|
| `list_worlds` | List all worlds |
| `get_world` | Get world details and summary stats |
| `create_world` | Create a new world |
| `update_world` | Update world name/description |
| `delete_world` | Delete a world and all its contents |
| `list_characters` | List characters in a world |
| `get_character` | Get character with full description |
| `create_character` | Create a character in a world |
| `update_character` | Update character name/description |
| `delete_character` | Delete a character |
| `list_locations` | List locations in a world |
| `get_location` | Get location with full description |
| `create_location` | Create a location in a world |
| `update_location` | Update location name/description |
| `delete_location` | Delete a location |
| `list_stories` | List stories in a world |
| `get_story` | Get story with characters, locations, lore artifacts |
| `delete_story` | Delete a story |
| `list_lore` | List lore artifacts, filterable by status, character, location |
| `update_lore_status` | Change artifact status (keep/discard) |

### Generation Tools

| Tool | Description |
|------|-------------|
| `get_world_context` | Assemble full world context — characters, locations, kept lore, recent stories. This is what the AI reads before generating. |
| `save_story` | Save a generated story with linked characters and locations. Returns the created story. |
| `save_lore_artifacts` | Save a batch of lore artifacts generated from a story. All created with status `pending`. |

### Advisory Tools

| Tool | Description |
|------|-------------|
| `check_consistency` | Read world context and flag potential inconsistencies — contradictory descriptions, orphaned references, thin characters/locations that need fleshing out. |
| `suggest_connections` | Analyze characters and locations for potential relationships or shared history the user hasn't explicitly defined. |

## Validation Rules

- **name** fields: required, 1–255 characters, trimmed
- **description/content** fields: required where marked, no max length
- **worldId**: must reference an existing world; return 404 if not
- **characterIds/locationIds** on story save: all must belong to the specified world
- **lore status**: must be one of `pending`, `kept`, `discarded`
- **Status transitions**: any direction is valid (user can re-keep a discarded artifact)

## Design Principles

- **Location-aware consistency**: `get_world_context` always includes all locations, regardless of what the user selected. The AI should ground every story in the world's geography.
- **Two sources of flavor**: World context assembles both authored descriptions and kept lore artifacts. Both feed into generation prompts.
- **MCP is the primary interface**: The web UI is for browsing and manual edits. The MCP tools are how the AI builds and enriches the world.
