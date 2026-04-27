# Build Plan

Seven vertical slices. Each slice produces working software — schema, routes, views, and tests. Earlier slices establish patterns that later slices reuse.

## Slice 1: Project Setup + World CRUD

**Covers:** Project initialization, Prisma + SQLite, Fastify server, Tailwind, layout template, World entity.

**Steps:**
1. `npm init`, install dependencies (fastify, @fastify/view, @fastify/formbody, @fastify/static, handlebars, prisma, @prisma/client, tsx, vitest, typescript, @types/node)
2. TypeScript config, project structure (src/routes, src/services, src/views, prisma/), `.gitignore` (node_modules, dist, prisma/*.db, .env)
3. Prisma schema with World model, initial migration
4. Fastify server entry point with Handlebars view engine
5. Layout template: nav bar ("Lorekeeper" → /worlds), content area, Tailwind via CDN (build step later if needed)
6. World service layer (create, list, getById, update, delete with validation)
7. World web routes: list, new form, create, detail, edit form, update, delete (all POST for mutations)
8. Tests: service layer tests + web route smoke tests (200s and redirects), separate test.db

**Dependencies:** None — this is the foundation.

**Done when:** You can create, browse, edit, and delete worlds in a browser. Service tests and route tests pass.

## Slice 2: Characters

**Covers:** Character model, nested routes, establishing the child-entity pattern.

**Steps:**
1. Add Character to Prisma schema (worldId FK, cascade delete), migrate
2. Character service layer (CRUD scoped to world)
3. Character web routes nested under `/worlds/:worldId/characters` (POST for mutations)
4. Character views: list, form (with description placeholder text), detail
5. Breadcrumb partial: World > Characters > [Name]
6. World detail page updated: show character count, link to character list
7. Tests: service layer (Character CRUD, world scoping, cascade delete) + route smoke tests

**Dependencies:** Slice 1.

**Done when:** Characters are fully functional with breadcrumbs and world scoping. This slice establishes the pattern for all child entities.

## Slice 3: Locations

**Covers:** Location model — same pattern as characters.

**Steps:**
1. Add Location to Prisma schema, migrate
2. Location service + web routes + views — following the character pattern
3. World detail page updated: show location count
4. Tests: service layer (Location CRUD, world scoping, cascade delete) + route smoke tests

**Dependencies:** Slice 2 (reuses the child-entity pattern).

**Done when:** Locations work. If this slice goes fast and feels mechanical, the pattern from Slice 2 is solid.

## Slice 4: Stories + Join Tables

**Covers:** Story model, StoryCharacter and StoryLocation join tables, story display.

**Steps:**
1. Add Story, StoryCharacter, StoryLocation to Prisma schema, migrate
2. Story service: save story with character/location links, list, get with relations, delete
3. Story web routes: list (newest first, content preview, character tags), detail (reading experience — full text, prompt callout, linked characters/locations)
4. No create/edit in web UI — stories come through MCP
5. Character detail page: add "Stories featuring this character" section
6. Location detail page: add "Stories set here" section
7. World detail page: show story count
8. Tests: service layer (story save with links, detail includes related entities, characterIds/locationIds validated against world) + route smoke tests

**Dependencies:** Slices 2, 3.

**Done when:** You can save a story via the service layer (or MCP in Slice 7) with linked characters and locations, browse stories in the web UI, and see story links on character/location detail pages.

## Slice 5: Lore Artifacts

**Covers:** LoreArtifact model, review lifecycle, inline status updates.

**Steps:**
1. Add LoreArtifact to Prisma schema (status enum, optional character/location FKs), migrate
2. Lore service: create (single + batch), list with filters, update status
3. Lore web views: list page with status filter tabs (All/Pending/Kept/Discarded)
4. Inline keep/discard buttons with vanilla JS fetch (POST to status route, no page reload)
5. Story detail page: show lore artifacts with keep/discard buttons
6. Character detail page: show kept lore about this character
7. Location detail page: show kept lore about this place
8. Tests: service layer (lore CRUD, status transitions, filtering by status, batch create, soft delete behavior) + route smoke tests

**Dependencies:** Slice 4.

**Done when:** Full lore lifecycle — create artifacts via service layer, review in browser, filter by status, keep/discard inline.

## Slice 6: World Context + Story Generation Guide

**Covers:** The world context endpoint (what the AI reads) and the UI guidance for story generation.

**Steps:**
1. World context service function: assembles world, characters, locations, kept lore, recent stories (titles + truncated content)
2. Story list empty state: generation guide with steps and link to `/setup`
3. World detail callout: "Ready for a story?" card (shows when characters/locations exist but no stories)
4. Empty states for all other list pages (worlds, characters, locations, lore)
5. The Lorekeeper's Inscription page (`/lorekeeper`) — see views spec
6. Tests: service layer (context shape, only kept lore included, recent stories ordered correctly)

**Dependencies:** Slice 5.

**Done when:** `getWorldContext(id)` returns everything the AI needs. Empty states guide users through the flow.

## Slice 7: MCP Server

**Covers:** MCP server with all tools, setup page, skill file.

**Steps:**
1. MCP server entry point (stdio transport, `@modelcontextprotocol/sdk`)
2. CRUD tools: list/get/create/update/delete for worlds, characters, locations; list/get/delete stories; list/update lore
3. Generation tools: get_world_context, save_story, save_lore_artifacts (batch)
4. Advisory tools: check_consistency, suggest_connections (data retrieval only — return structured data, LLM in skill file does the reasoning)
5. MCP setup page (`/setup`): what MCP is, connection instructions, server command, tool reference
6. Skill file for guided world-building (system prompt that teaches the AI how to collaborate)
7. Tests: MCP tool calls against test database

**Dependencies:** Slice 6.

**Done when:** Claude Code connects via MCP and can create worlds, build characters, generate stories, and review lore. The setup page explains how to connect.

## Architecture Notes

- **Shared service layer.** Web routes and MCP tools call the same service functions. No duplicated logic, no JSON API routes.
- **POST for web mutations.** HTML forms use POST for create, update, and delete. Update routes use `/update` suffix, delete routes use `/delete` suffix.
- **Test isolation.** Tests use `test.db`, never `dev.db`. Fail fast if paths match.
- **Two test layers.** Service layer tests verify business logic. Web route tests verify templates render and redirects work.
- **Tailwind via CDN** for Slice 1. If build times become a problem, add a build step later.
