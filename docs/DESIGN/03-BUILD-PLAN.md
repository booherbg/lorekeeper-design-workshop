# Build Plan

Seven vertical slices. Each slice produces working software — schema, routes, views, and tests. Earlier slices establish patterns that later slices reuse.

## Slice 1: Project Setup + World CRUD

**Covers:** Project initialization, Prisma + SQLite, Fastify server, Tailwind, layout template, World entity.

**Steps:**
1. `npm init`, install dependencies (fastify, @fastify/view, @fastify/formbody, @fastify/static, handlebars, prisma, @prisma/client, tailwind, tsx, vitest)
2. TypeScript config, project structure (src/routes, src/services, src/views, prisma/)
3. Prisma schema with World model, initial migration
4. Fastify server entry point with Handlebars view engine
5. Layout template: nav bar ("Lorekeeper" → /worlds), content area, Tailwind via CDN (build step later if needed)
6. World web routes: list, new form, create, detail, edit form, update, delete
7. World API routes: GET/POST/PUT/DELETE (JSON)
8. Service layer for World (shared between web and API routes)
9. Tests: World CRUD via Fastify `.inject()`, separate test.db

**Dependencies:** None — this is the foundation.

**Done when:** You can create, browse, edit, and delete worlds in a browser. API returns JSON. Tests pass.

## Slice 2: Characters

**Covers:** Character model, nested routes, establishing the child-entity pattern.

**Steps:**
1. Add Character to Prisma schema (worldId FK, cascade delete), migrate
2. Character service layer (CRUD scoped to world)
3. Character web routes nested under `/worlds/:worldId/characters`
4. Character views: list, form (with description placeholder text), detail
5. Breadcrumb partial: World > Characters > [Name]
6. World detail page updated: show character count, link to character list
7. Character API routes (JSON, nested under `/api/worlds/:worldId/characters`)
8. Tests: Character CRUD, world scoping (can't access character from wrong world), cascade delete

**Dependencies:** Slice 1.

**Done when:** Characters are fully functional with breadcrumbs and world scoping. This slice establishes the pattern for all child entities.

## Slice 3: Locations

**Covers:** Location model — same pattern as characters.

**Steps:**
1. Add Location to Prisma schema, migrate
2. Location service, web routes, API routes, views — following the character pattern
3. World detail page updated: show location count
4. Tests: Location CRUD, world scoping, cascade delete

**Dependencies:** Slice 2 (reuses the child-entity pattern).

**Done when:** Locations work. If this slice goes fast and feels mechanical, the pattern from Slice 2 is solid.

## Slice 4: Stories + Join Tables

**Covers:** Story model, StoryCharacter and StoryLocation join tables, story display.

**Steps:**
1. Add Story, StoryCharacter, StoryLocation to Prisma schema, migrate
2. Story service: save story with character/location links, list, get with relations, delete
3. Story API routes: POST (accepts characterIds/locationIds), GET list, GET detail, DELETE
4. Story web routes: list (newest first, content preview, character tags), detail (reading experience — full text, prompt callout, linked characters/locations)
5. No create/edit in web UI — stories come through the API
6. Character detail page: add "Stories featuring this character" section
7. Location detail page: add "Stories set here" section
8. World detail page: show story count
9. Tests: Story save with links, detail includes related entities, characterIds/locationIds validated against world

**Dependencies:** Slices 2, 3.

**Done when:** You can save a story via API with linked characters and locations, browse stories in the web UI, and see story links on character/location detail pages.

## Slice 5: Lore Artifacts

**Covers:** LoreArtifact model, review lifecycle, inline status updates.

**Steps:**
1. Add LoreArtifact to Prisma schema (status enum, optional character/location FKs), migrate
2. Lore service: create (single + batch), list with filters, update status
3. Lore API routes: POST, GET (filterable by status/character/location), PUT status
4. Lore web views: list page with status filter tabs (All/Pending/Kept/Discarded)
5. Inline keep/discard buttons with vanilla JS fetch (no page reload)
6. Story detail page: show lore artifacts with keep/discard buttons
7. Character detail page: show kept lore about this character
8. Location detail page: show kept lore about this place
9. Tests: Lore CRUD, status transitions, filtering by status, batch create, soft delete behavior

**Dependencies:** Slice 4.

**Done when:** Full lore lifecycle — create artifacts via API, review in browser, filter by status, keep/discard inline.

## Slice 6: World Context + Story Generation Guide

**Covers:** The world context endpoint (what the AI reads) and the UI guidance for story generation.

**Steps:**
1. World context API endpoint: assembles world, characters, locations, kept lore, recent stories (titles + truncated content)
2. Story list empty state: generation guide with steps and link to `/setup`
3. World detail callout: "Ready for a story?" card (shows when characters/locations exist but no stories)
4. Empty states for all other list pages (worlds, characters, locations, lore)
5. Tests: Context endpoint shape, only kept lore included, recent stories ordered correctly

**Dependencies:** Slice 5.

**Done when:** `GET /api/worlds/:id/context` returns everything the AI needs. Empty states guide users through the flow.

## Slice 7: MCP Server

**Covers:** MCP server with all tools, setup page, skill file.

**Steps:**
1. MCP server entry point (stdio transport, `@modelcontextprotocol/sdk`)
2. CRUD tools: list/get/create/update/delete for worlds, characters, locations; list/get/delete stories; list/update lore
3. Generation tools: get_world_context, save_story, save_lore_artifacts (batch)
4. Advisory tools: check_consistency, suggest_connections (read-only, return analysis)
5. MCP setup page (`/setup`): what MCP is, connection instructions, server command, tool reference
6. Skill file for guided world-building (system prompt that teaches the AI how to collaborate)
7. Tests: MCP tool calls against test database

**Dependencies:** Slice 6.

**Done when:** Claude Code connects via MCP and can create worlds, build characters, generate stories, and review lore. The setup page explains how to connect.

## Architecture Notes

- **Shared service layer.** Web routes and API routes call the same service functions. No duplicated logic.
- **Test isolation.** Tests use `test.db`, never `dev.db`. Fail fast if paths match.
- **Tailwind via CDN** for Slice 1. If build times become a problem, add a build step later.
- **Method override.** HTML forms only support GET/POST. Use `@fastify/formbody` with a `_method` field for PUT/DELETE from the web UI, or use POST routes for updates/deletes in the web layer.
