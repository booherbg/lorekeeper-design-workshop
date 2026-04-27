# Data Models Spec

## Entities

### World

The top-level container. Everything belongs to a world.

| Field | Type | Constraints |
|-------|------|-------------|
| id | int | PK, auto-increment |
| name | string | required, max 255 |
| description | text | optional |
| createdAt | datetime | auto |
| updatedAt | datetime | auto |

### Character

A person (or creature, or entity) in the world. Description is freeform rich text — personality, appearance, quirks, relationships, whatever the user wants.

| Field | Type | Constraints |
|-------|------|-------------|
| id | int | PK, auto-increment |
| worldId | int | FK → World, required, cascade delete |
| name | string | required, max 255 |
| description | text | required |
| createdAt | datetime | auto |
| updatedAt | datetime | auto |

### Location

A place in the world. Lightweight — name and atmospheric description. Serves as a consistency anchor for story generation.

| Field | Type | Constraints |
|-------|------|-------------|
| id | int | PK, auto-increment |
| worldId | int | FK → World, required, cascade delete |
| name | string | required, max 255 |
| description | text | required |
| createdAt | datetime | auto |
| updatedAt | datetime | auto |

### Story

A generated story. Saved to the collection for browsing and re-reading. The prompt records what the user asked for.

| Field | Type | Constraints |
|-------|------|-------------|
| id | int | PK, auto-increment |
| worldId | int | FK → World, required, cascade delete |
| title | string | required, max 255 |
| content | text | required |
| prompt | text | required |
| createdAt | datetime | auto |

### StoryCharacter

Join table linking stories to the characters that appear in them.

| Field | Type | Constraints |
|-------|------|-------------|
| storyId | int | FK → Story, cascade delete |
| characterId | int | FK → Character, cascade delete |

Composite PK: (storyId, characterId)

### StoryLocation

Join table linking stories to the locations featured in them.

| Field | Type | Constraints |
|-------|------|-------------|
| storyId | int | FK → Story, cascade delete |
| locationId | int | FK → Location, cascade delete |

Composite PK: (storyId, locationId)

### LoreArtifact

Emergent world texture generated from stories. Users review artifacts and decide what to keep. Only kept artifacts feed into future story generation.

| Field | Type | Constraints |
|-------|------|-------------|
| id | int | PK, auto-increment |
| worldId | int | FK → World, required, cascade delete |
| storyId | int | FK → Story, required, cascade delete |
| characterId | int | FK → Character, optional, set null on delete |
| locationId | int | FK → Location, optional, set null on delete |
| content | text | required |
| status | enum | required, one of: pending, kept, discarded |
| createdAt | datetime | auto |

## Relationships summary

```
World 1──∞ Character
World 1──∞ Location
World 1──∞ Story
World 1──∞ LoreArtifact

Story ∞──∞ Character (via StoryCharacter)
Story ∞──∞ Location (via StoryLocation)
Story 1──∞ LoreArtifact

LoreArtifact ∞──1 Character (optional)
LoreArtifact ∞──1 Location (optional)
```

## Design principles

- **Location-aware consistency:** Story generation and world-building advice always pull in relevant locations and world background, even when the user hasn't explicitly selected them. Locations anchor the world.
- **Two sources of flavor:** Authored descriptions (on characters and locations) and emergent lore (artifacts). Both feed into story generation context.
- **Soft delete for artifact status:** Discarding an artifact changes its status — the row stays. This is not the same as cascade behavior: deleting a *story* hard-deletes its lore artifacts (cascade), and deleting a *world* hard-deletes everything in it (cascade). "Soft delete" only applies to the keep/discard lifecycle.
- **Cascade deletes on ownership:** Deleting a world removes everything in it. Deleting a story removes its lore artifacts. Deleting a character/location nullifies optional references on lore artifacts but doesn't destroy them.
