# Tech Stack

This document describes the recommended technology stack for Lorekeeper. These are opinionated defaults chosen for simplicity, fast setup, and minimal configuration.

**You are free to change any of this.** If you'd prefer a different framework, language, or database, delete the relevant section below and design your own during the spec phase. The design process is what matters — the tools are up to you.

---

## Runtime and language

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Node.js (LTS) | Widely available, excellent tooling, large ecosystem |
| Language | TypeScript | Type safety catches bugs at compile time; excellent editor support |
| Package manager | npm | Ships with Node.js — nothing extra to install |

## Backend

| Component | Choice | Why |
|-----------|--------|-----|
| Web framework | Fastify | Fast, well-documented, great plugin ecosystem, built-in validation support |
| Template engine | Handlebars (via `@fastify/view`) | Simple, readable templates; no build step; familiar syntax |
| ORM | Prisma | Type-safe database access, excellent migration tooling, great DX |
| Database | SQLite (via Prisma) | Zero configuration — it's just a file. No server to install or manage |

## Frontend

| Component | Choice | Why |
|-----------|--------|-----|
| Styling | Tailwind CSS | Utility-first, no custom CSS to maintain, rapid prototyping |
| Templates | Handlebars | Server-rendered HTML — no client-side framework, no build toolchain |
| Interactivity | Vanilla JS (where needed) | For small interactions (modals, form validation); no framework overhead |

**Why no React/Vue/Svelte?** The base project is CRUD + story generation. Server-rendered HTML with Tailwind handles this cleanly without the complexity of a client-side framework, a bundler, or client/server state synchronization. If you want to add a frontend framework as a stretch goal, go for it — but start simple.

## Testing

| Component | Choice | Why |
|-----------|--------|-----|
| Test runner | Vitest | Fast, TypeScript-native, compatible with Jest API |
| Coverage | c8 / Vitest built-in | Coverage reporting without extra dependencies |
| HTTP testing | Fastify's `.inject()` | Test routes without starting a server |

**No Playwright for base scope.** E2E testing is a stretch goal. Unit and integration tests cover correctness for the base project.

## AI / MCP

| Component | Choice | Why |
|-----------|--------|-----|
| MCP SDK | `@modelcontextprotocol/sdk` | Standard MCP server implementation |
| MCP transport | stdio | Simple local connection — no network setup |

**No API keys. No AI SDK in the app.** The app is pure CRUD — it stores worlds, characters, locations, lore, and stories. All intelligence comes from **Claude Code connected via MCP**. The MCP server exposes tools that let Claude read your world data, generate stories, check consistency, and suggest lore. Claude Code is the AI layer; your app is the data layer.

## Project tooling

| Tool | Purpose |
|------|---------|
| `tsx` | Run TypeScript directly during development |
| `prisma` | Database migrations and schema management |
| ESLint | Code quality (optional but recommended) |
| Prettier | Code formatting (optional but recommended) |

## Architecture

```
Server-rendered monolith
├── Fastify server
│   ├── Routes (HTTP endpoints)
│   ├── Services (business logic)
│   ├── Repositories (data access via Prisma)
│   └── Views (Handlebars templates + Tailwind)
├── MCP Server (stdio transport)
│   └── Tools (world-building advisor, consistency checker)
└── Prisma + SQLite
    └── dev.db / test.db
```

---

> **Want to use something different?** Delete any section above and replace it with your choice during the design/spec phase. The agent will help you think through the trade-offs. Some alternatives to consider:
>
> - **Python + Flask/FastAPI** instead of Node.js + Fastify
> - **PostgreSQL** instead of SQLite (adds setup complexity but enables multi-user)
> - **React/Vue/Svelte** for a richer frontend (adds build toolchain)
> - **Drizzle** instead of Prisma (lighter ORM, more SQL-like)
> - **EJS or Pug** instead of Handlebars (different template syntax)
