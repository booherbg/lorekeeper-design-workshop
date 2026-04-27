import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanDb, createTestApp, createTestWorld, createTestStory } from "./helpers";
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

describe("GET /worlds/:worldId/stories", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/stories` });
    expect(res.statusCode).toBe(200);
  });

  it("returns 200 with stories", async () => {
    await createTestStory(worldId);
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/stories` });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /worlds/:worldId/stories/:id", () => {
  it("returns 200", async () => {
    const story = await createTestStory(worldId);
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/stories/${story.id}` });
    expect(res.statusCode).toBe(200);
  });

  it("returns 404 for nonexistent story", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/stories/99999` });
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /worlds/:worldId/stories/:id/delete", () => {
  it("redirects to list", async () => {
    const story = await createTestStory(worldId);
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/stories/${story.id}/delete`,
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/worlds/${worldId}/stories`);
  });
});
