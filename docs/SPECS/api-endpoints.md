# API Endpoints Spec

## Architecture

There are no JSON API routes. The app has two programmatic interfaces:

1. **Web routes** — server-rendered HTML for humans (Handlebars templates)
2. **MCP tools** — for Claude Code, calling the service layer directly (no HTTP)

Both web routes and MCP tools call the same service layer. Business logic and validation live in the service layer, not in route handlers or MCP tool definitions.

## Web Routes (Server-Rendered)

All web routes return HTML via Handlebars templates. Forms use POST for all mutations (create, update, delete) with redirects. No method override — POST is the only mutation verb in the web layer.

### Worlds

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Redirect to `/worlds` |
| GET | `/worlds` | List all worlds |
| GET | `/worlds/new` | Create world form |
| POST | `/worlds` | Create world, redirect to detail |
| GET | `/worlds/:id` | World detail — overview with counts of characters, locations, stories |
| GET | `/worlds/:id/edit` | Edit world form |
| POST | `/worlds/:id/update` | Update world, redirect to detail |
| POST | `/worlds/:id/delete` | Delete world, redirect to list |

### Characters

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/characters` | List characters in world |
| GET | `/worlds/:worldId/characters/new` | Create character form |
| POST | `/worlds/:worldId/characters` | Create character, redirect to detail |
| GET | `/worlds/:worldId/characters/:id` | Character detail — description, stories featuring them, lore about them |
| GET | `/worlds/:worldId/characters/:id/edit` | Edit character form |
| POST | `/worlds/:worldId/characters/:id/update` | Update character, redirect to detail |
| POST | `/worlds/:worldId/characters/:id/delete` | Delete character, redirect to list |

### Locations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/locations` | List locations in world |
| GET | `/worlds/:worldId/locations/new` | Create location form |
| POST | `/worlds/:worldId/locations` | Create location, redirect to detail |
| GET | `/worlds/:worldId/locations/:id` | Location detail — description, stories set here, lore about this place |
| GET | `/worlds/:worldId/locations/:id/edit` | Edit location form |
| POST | `/worlds/:worldId/locations/:id/update` | Update location, redirect to detail |
| POST | `/worlds/:worldId/locations/:id/delete` | Delete location, redirect to list |

### Stories

Stories are immutable once created. No edit route.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/stories` | List stories in world |
| GET | `/worlds/:worldId/stories/:id` | Story detail — full text, characters, locations, lore artifacts generated |
| POST | `/worlds/:worldId/stories/:id/delete` | Delete story, redirect to list |

### Lore Artifacts

Lore artifacts are viewed in context (story detail, character detail, location detail). The standalone list page supports filtering. Status updates use inline JS fetch for a snappy UX.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worlds/:worldId/lore` | List all lore artifacts in world, filterable by status |
| POST | `/worlds/:worldId/lore/:id/status` | Update artifact status — returns JSON, not a redirect |

**Lore status update** is the one route that returns JSON instead of HTML. It's called via `fetch()` from inline JS — no page reload. Request and response shapes:

```
Request:  POST /worlds/:worldId/lore/:id/status
Headers:  Content-Type: application/json
Body:     { "status": "kept" }       // or "discarded" or "pending"
Response: 200
Body:     { "id": 3, "status": "kept" }
```

Returns 400 if status is not one of `pending`, `kept`, `discarded`. Returns 404 if artifact doesn't exist or doesn't belong to this world.

### The Lorekeeper's Inscription

| Method | Path | Description |
|--------|------|-------------|
| GET | `/lorekeeper` | The Lorekeeper's inscription — not linked from navigation, discoverable only by the curious |

This page is not world-scoped. It exists outside the normal navigation hierarchy.

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
| `check_consistency` | Return world context structured for consistency review. The LLM in the skill file analyzes the data — our code just assembles and returns it. |
| `suggest_connections` | Return characters and locations with their descriptions and existing relationships. The LLM identifies potential connections — our code provides the data. |

Advisory tools are **data retrieval**, not analysis. They return structured data; the AI (via the skill file) does the reasoning. This keeps our code simple and deterministic.

## Validation Rules

- **name** fields: required, 1–255 characters, trimmed
- **description/content** fields: required where marked, no max length
- **worldId**: must reference an existing world; return 404 if not
- **characterIds/locationIds** on story save: all must belong to the specified world
- **lore status**: must be one of `pending`, `kept`, `discarded`
- **Status transitions**: any direction is valid (user can re-keep a discarded artifact)

## Service Layer Contract

MCP tools and web routes both call the same service functions. The service layer owns validation and business logic. Shapes documented here for clarity — these are what the service functions accept and return.

### Story creation shape

```typescript
createStory(worldId, {
  title: "The Blacksmith's Bargain",
  content: "Long-form story text...",
  prompt: "Tell me a bedtime story about the blacksmith meeting a stranger",
  characterIds: [1, 3],
  locationIds: [2],
})
```

The AI generates the story content externally, then saves it through the MCP `save_story` tool.

### Lore artifact creation shapes

Single:

```typescript
createLoreArtifact(worldId, {
  storyId: 7,
  content: "The blacksmith always taps his hammer three times before starting work",
  characterId: 1,
  locationId: null,
  status: "pending",
})
```

Batch (used by MCP `save_lore_artifacts` tool after story generation):

```typescript
createLoreArtifacts(worldId, [
  { storyId: 7, content: "The blacksmith always taps...", characterId: 1, locationId: null },
  { storyId: 7, content: "The forge smells of copper...", characterId: null, locationId: 2 },
])
// All created with status "pending". storyId and worldId are the same for the entire batch.
```

### World context shape

```typescript
getWorldContext(worldId)
// => {
//   world: { id: 1, name: "...", description: "..." },
//   characters: [{ id: 1, name: "...", description: "..." }, ...],
//   locations: [{ id: 1, name: "...", description: "..." }, ...],
//   lore: [{ id: 1, content: "...", characterId: 1, locationId: null }, ...],
//   recentStories: [{ id: 7, title: "...", contentPreview: "First 200 chars..." }, ...],
// }
```

- The `lore` array only includes artifacts with status `kept`.
- The `recentStories` array returns the **5 most recent** stories ordered by `createdAt` desc. The `contentPreview` field is the first 200 characters of `content` — there is no summary field on the Story model.

## Design Principles

- **No JSON API routes.** MCP tools call service functions directly. Web routes render HTML. No redundant HTTP/JSON layer.
- **Location-aware consistency**: `get_world_context` always includes all locations, regardless of what the user selected. The AI should ground every story in the world's geography.
- **Two sources of flavor**: World context assembles both authored descriptions and kept lore artifacts. Both feed into generation prompts.
- **Service layer is the contract**: Both MCP tools and web routes depend on the same service functions. Test the service layer to verify correctness for both interfaces.
