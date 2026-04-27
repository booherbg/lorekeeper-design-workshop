import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanDb, createTestApp, createTestWorld, createTestLocation } from "./helpers";
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

describe("GET /worlds/:worldId/locations", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/locations` });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /worlds/:worldId/locations/new", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/locations/new` });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /worlds/:worldId/locations", () => {
  it("redirects to location detail", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/locations`,
      payload: { name: "The Forge", description: "A workshop" },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toMatch(/\/worlds\/\d+\/locations\/\d+/);
  });
});

describe("GET /worlds/:worldId/locations/:id", () => {
  it("returns 200", async () => {
    const loc = await createTestLocation(worldId);
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/locations/${loc.id}` });
    expect(res.statusCode).toBe(200);
  });

  it("returns 404 for nonexistent location", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/locations/99999` });
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /worlds/:worldId/locations/:id/update", () => {
  it("redirects to detail", async () => {
    const loc = await createTestLocation(worldId);
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/locations/${loc.id}/update`,
      payload: { name: "Updated", description: "New" },
    });
    expect(res.statusCode).toBe(302);
  });
});

describe("POST /worlds/:worldId/locations/:id/delete", () => {
  it("redirects to list", async () => {
    const loc = await createTestLocation(worldId);
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/locations/${loc.id}/delete`,
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/worlds/${worldId}/locations`);
  });
});
