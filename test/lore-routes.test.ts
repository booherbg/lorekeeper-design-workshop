import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanDb, createTestApp, createTestWorld, createTestStory } from "./helpers";
import { createLoreArtifact } from "../src/services/lore-service";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let worldId: number;
let storyId: number;

beforeEach(async () => {
  await cleanDb();
  app = await createTestApp();
  const world = await createTestWorld();
  worldId = world.id;
  const story = await createTestStory(worldId);
  storyId = story.id;
});

afterAll(async () => {
  await app.close();
});

describe("GET /worlds/:worldId/lore", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/lore` });
    expect(res.statusCode).toBe(200);
  });

  it("returns 200 with status filter", async () => {
    const res = await app.inject({ method: "GET", url: `/worlds/${worldId}/lore?status=kept` });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /worlds/:worldId/lore/:id/status", () => {
  it("returns JSON with updated status", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "test lore",
      characterId: null,
      locationId: null,
    });
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/lore/${lore.id}/status`,
      payload: { status: "kept" },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.id).toBe(lore.id);
    expect(body.status).toBe("kept");
  });

  it("returns 400 for invalid status", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "test lore",
      characterId: null,
      locationId: null,
    });
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/lore/${lore.id}/status`,
      payload: { status: "invalid" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for nonexistent artifact", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${worldId}/lore/99999/status`,
      payload: { status: "kept" },
    });
    expect(res.statusCode).toBe(404);
  });
});
