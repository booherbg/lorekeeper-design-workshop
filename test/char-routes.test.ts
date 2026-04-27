import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanDb, createTestApp, createTestWorld, createTestCharacter } from "./helpers";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let worldId: number;

beforeEach(async () => {
  await cleanDb();
  app = await createTestApp();
  const world = await createTestWorld();
  worldId = world.id;
});

afterAll(async () => {
  await app.close();
});

describe("GET /worlds/:worldId/characters", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/characters` });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /worlds/:worldId/characters/new", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/characters/new` });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /worlds/:worldId/characters", () => {
  it("redirects to character detail", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/characters`,
      payload: { name: "Elara", description: "A healer" },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toMatch(/\/worlds\/\d+\/characters\/\d+/);
  });
});

describe("GET /worlds/:worldId/characters/:id", () => {
  it("returns 200", async () => {
    const char = await createTestCharacter(worldId);
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/characters/${char.id}` });
    expect(res.statusCode).toBe(200);
  });

  it("returns 404 for nonexistent character", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/characters/99999` });
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /worlds/:worldId/characters/:id/edit", () => {
  it("returns 200", async () => {
    const char = await createTestCharacter(worldId);
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/characters/${char.id}/edit` });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /worlds/:worldId/characters/:id/update", () => {
  it("redirects to detail", async () => {
    const char = await createTestCharacter(worldId);
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/characters/${char.id}/update`,
      payload: { name: "Updated", description: "New" },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/worlds/${worldId}/characters/${char.id}`);
  });
});

describe("POST /worlds/:worldId/characters/:id/delete", () => {
  it("redirects to list", async () => {
    const char = await createTestCharacter(worldId);
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/characters/${char.id}/delete`,
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/worlds/${worldId}/characters`);
  });
});
