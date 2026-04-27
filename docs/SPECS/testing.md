# Testing Spec

## Strategy

Two test layers against a real SQLite database, no mocks:

1. **Service layer tests** — test business logic directly by calling service functions. This is where validation, CRUD correctness, scoping, and cascade behavior are verified. These are the workhorse tests.
2. **Web route tests** — lightweight Fastify `.inject()` tests that prove templates render (200 status) and form submissions redirect correctly. No HTML content assertions.

No JSON API routes exist — MCP tools call the service layer directly. Service tests are the contract tests for both web routes and MCP tools.

This approach optimizes for **unattended execution** — deterministic, no network, no browser, no flaky waits.

## Test Infrastructure

### Database isolation

- Tests use `prisma/test.db`. Dev uses `prisma/dev.db`.
- **Fail-fast guard:** The `globalSetup` file asserts `DATABASE_URL` contains `test.db` **before** running `prisma migrate reset`. If the env var is missing or contains `dev.db`, throw immediately — this prevents accidentally wiping the development database.
- **Fresh state per run:** A Vitest `globalSetup` file runs `prisma migrate reset --force` once before any tests execute. Not per-suite — once per `vitest run`. This applies all migrations to a clean database.
- **Clean state between tests:** Each test file calls `cleanDb()` in `beforeEach`. This deletes all worlds, which cascades to all child entities via the Prisma schema's `onDelete: Cascade` rules.
- **Cascade verification:** The first integration test in Slice 2 should verify that deleting a world actually removes its children. If this fails, SQLite's `PRAGMA foreign_keys` isn't enabled — investigate before proceeding.

### Prisma client

A single shared `PrismaClient` instance lives in `src/db.ts`. All services import it. No dependency injection — the test script sets `DATABASE_URL=file:./test.db` before anything imports, so Prisma automatically connects to the test database.

```typescript
// src/db.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

### Database cleanup

```typescript
// test/helpers.ts
import { prisma } from "../src/db";

export async function cleanDb() {
  // Relies on cascade deletes configured in the Prisma schema.
  // Deleting all worlds cascades to all child entities.
  // If a model is added that doesn't belong to a world, add it here explicitly.
  await prisma.world.deleteMany();
}
```

### Fastify test app

For web route tests only. A shared `buildApp()` helper that:
1. Creates a Fastify instance with all plugins, routes, and views registered
2. Uses the test database connection
3. Returns the app instance (no `.listen()` call — `.inject()` doesn't need it)
4. Closes Fastify in `afterAll` — but **never** disconnects Prisma in individual test files (the singleton is shared across all files; disconnecting it kills subsequent files)

```typescript
// test/helpers.ts
import { buildApp } from "../src/app";

export async function createTestApp() {
  const app = await buildApp();
  return app;
}
```

### Environment

- `DATABASE_URL=file:./test.db` set inline in the test script
- Vitest config specifies a `globalSetup` file that runs `prisma migrate reset --force` once per `vitest run`
- Vitest config specifies a `globalTeardown` file that disconnects the Prisma client after all tests complete
- Individual test files **never** call `prisma.$disconnect()` — only the globalTeardown does

### package.json scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "DATABASE_URL=file:./test.db vitest run",
    "test:watch": "DATABASE_URL=file:./test.db vitest",
    "db:reset": "prisma migrate reset --force"
  }
}
```

## TypeScript conventions

- **No path aliases.** All imports use relative paths. Boring but eliminates a class of config errors.
- **Strict mode on.** `tsconfig.json` enables `strict: true`.

## What to test per entity

Every entity (World, Character, Location, Story, LoreArtifact) follows this pattern. The examples below use World — later slices replicate the pattern.

### Service layer tests

Services export **named functions** (not an object with methods). Naming convention: `createWorld`, `listWorlds`, `getWorldById`, `updateWorld`, `deleteWorld`. Later entities follow the same pattern: `createCharacter`, `listCharacters`, etc.

#### `createWorld(data)`

```typescript
import { createWorld } from "../src/services/world-service";

const world = await createWorld({ name: "Eldoria", description: "A land of ancient magic" });
// => { id: 1, name: "Eldoria", description: "A land of ancient magic", createdAt: ..., updatedAt: ... }
```

- Creates with valid input, returns the created entity
- Throws/returns error when name is missing
- Throws/returns error when name is empty string / whitespace only
- Trims whitespace from name
- Creates with null/missing description (optional for World)

#### `listWorlds()`

```typescript
const worlds = await listWorlds();
// => [{ id: 1, name: "Eldoria", ... }]
```

- Returns empty array when no worlds exist
- Returns all worlds after creating several

#### `getWorldById(id)`

```typescript
const world = await getWorldById(1);
// => { id: 1, name: "Eldoria", ... }
```

- Returns the world by ID
- Returns null / throws for nonexistent ID

#### `updateWorld(id, data)`

```typescript
const world = await updateWorld(1, { name: "Eldoria Reborn", description: "Updated" });
// => { id: 1, name: "Eldoria Reborn", description: "Updated", ... }
```

- Updates with valid input
- Throws for nonexistent ID
- Validates input (same rules as create)

#### `deleteWorld(id)`

- Deletes the world
- Throws for nonexistent ID
- Cascade: deleting a world deletes all children (tested in later slices when children exist)

### Web route tests

Web route tests are lightweight — status codes and redirects only.

#### For each web route, assert:

- **GET list** (`/worlds`): returns 200
- **GET new form** (`/worlds/new`): returns 200
- **POST create** (`POST /worlds` with form body): returns 302 redirect to the new world's detail page
- **GET detail** (`/worlds/:id`): returns 200
- **GET edit form** (`/worlds/:id/edit`): returns 200
- **POST update** (`POST /worlds/:id/update`): returns 302 redirect to detail
- **POST delete** (`POST /worlds/:id/delete`): returns 302 redirect to list
- **GET detail for nonexistent ID**: returns 404

These tests prove the templates render without crashing and the redirects go to the right place. We don't assert on HTML content.

### Child entity scoping (Slice 2+)

For entities nested under a world (tested at the service layer):

- Can't retrieve a character that belongs to a different world
- Creating a character under a nonexistent world fails
- Deleting a world cascades to its characters

### Join table behavior (Slice 4+)

- Saving a story with characterIds/locationIds creates the join records
- Retrieving a story includes linked characters and locations
- characterIds/locationIds must belong to the same world (fails if not)

### Lore lifecycle (Slice 5+)

- Create with status `pending`
- Batch create works (all get status `pending`)
- Update status to `kept` or `discarded`
- Any status transition is valid (can re-keep a discarded artifact)
- Filter by status returns only matching artifacts

**Note:** The lore status web route (`POST /worlds/:worldId/lore/:id/status`) returns JSON, not a redirect — it's the one exception. Route tests for this endpoint should assert on JSON response body and status code, not redirect behavior.

## What NOT to test

- **HTML structure.** Don't assert on CSS classes, element IDs, or specific markup. Templates change; behavior doesn't.
- **Prisma itself.** We trust the ORM. We're testing our code's use of it.
- **Happy-path duplication.** If the service test covers create validation, the web route test just checks the redirect. Don't test the same logic twice through different entry points.
- **Template content.** Don't assert that a page "contains" specific text — fragile and adds no safety.

## Test file organization

```
test/
  global-setup.ts         — runs prisma migrate reset --force once per vitest run
  global-teardown.ts      — disconnects Prisma client after all tests complete
  helpers.ts              — DB cleanup, test factories, buildApp
  world-service.test.ts   — World service tests
  world-routes.test.ts    — World web route tests
  char-service.test.ts    — Character service tests (Slice 2)
  char-routes.test.ts     — Character web route tests (Slice 2)
  loc-service.test.ts     — Location service tests (Slice 3)
  loc-routes.test.ts      — Location web route tests (Slice 3)
  story-service.test.ts   — Story service tests (Slice 4)
  story-routes.test.ts    — Story web route tests (Slice 4)
  lore-service.test.ts    — Lore artifact service tests (Slice 5)
  lore-routes.test.ts     — Lore web route tests (Slice 5)
  context-service.test.ts — World context tests (Slice 6)
  mcp-tools.test.ts       — MCP tool calls against test database (Slice 7)
```

## Test factories

Simple helper functions that create entities with sensible defaults via the service layer. Reduces boilerplate and makes tests readable.

```typescript
// test/helpers.ts
import { createWorld } from "../src/services/world-service";

export async function createTestWorld(overrides = {}) {
  return createWorld({ name: "Test World", description: "A test world", ...overrides });
}
```

Later slices add `createTestCharacter(worldId, overrides)`, `createTestLocation(...)`, etc. Factories call service functions (not Prisma directly) so they go through the same validation path as production code.

## Test naming

Describe blocks mirror the service method or route. Test names describe the scenario and outcome.

```typescript
describe("createWorld", () => {
  it("creates a world with valid input");
  it("throws when name is missing");
  it("throws when name is empty string");
  it("trims whitespace from name");
});

describe("GET /worlds", () => {
  it("returns 200");
  it("returns 200 when no worlds exist");
});
```

## Failure modes to watch for

These are the things most likely to break an unattended run:

| Risk | Mitigation |
|------|------------|
| Migration state drift between slices | `prisma migrate reset` in globalSetup — always clean |
| Import/path errors in TypeScript | No path aliases, relative imports only |
| Template rendering crashes | Every web route gets a 200-status test |
| Port conflicts on dev server | Configurable via `PORT` env var, tests don't bind ports |
| Test DB / dev DB collision | Fail-fast guard checks `DATABASE_URL` contains `test.db` |
| Stale Prisma Client after schema changes | `prisma generate` runs as part of `prisma migrate` |
| Cascade deletes silently not working | Explicit cascade verification test in Slice 2 |
| Vitest parallel file execution conflicts | Run test files sequentially (Vitest `--sequence` or `pool: 'forks'` with `singleFork: true`) since all files share one SQLite DB |
