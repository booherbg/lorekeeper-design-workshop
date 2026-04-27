import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanDb, createTestApp, createTestWorld } from "./helpers";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeEach(async () => {
  await cleanDb();
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("GET /worlds", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/worlds" });
    expect(res.statusCode).toBe(200);
  });

  it("returns 200 when no worlds exist", async () => {
    const res = await app.inject({ method: "GET", url: "/worlds" });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /worlds/new", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/worlds/new" });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /worlds", () => {
  it("redirects to the new world detail", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/worlds",
      payload: { name: "Test", description: "Desc" },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toMatch(/\/worlds\/\d+/);
  });
});

describe("GET /worlds/:id", () => {
  it("returns 200 for existing world", async () => {
    const world = await createTestWorld();
    const res = await app.inject({ method: "GET", url: `/worlds/${world.id}` });
    expect(res.statusCode).toBe(200);
  });

  it("returns 404 for nonexistent world", async () => {
    const res = await app.inject({ method: "GET", url: "/worlds/99999" });
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /worlds/:id/edit", () => {
  it("returns 200", async () => {
    const world = await createTestWorld();
    const res = await app.inject({
      method: "GET",
      url: `/worlds/${world.id}/edit`,
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("POST /worlds/:id/update", () => {
  it("redirects to detail", async () => {
    const world = await createTestWorld();
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${world.id}/update`,
      payload: { name: "Updated", description: "" },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/worlds/${world.id}`);
  });
});

describe("POST /worlds/:id/delete", () => {
  it("redirects to list", async () => {
    const world = await createTestWorld();
    const res = await app.inject({
      method: "POST",
      url: `/worlds/${world.id}/delete`,
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/worlds");
  });
});

describe("GET /", () => {
  it("redirects to /worlds", async () => {
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/worlds");
  });
});
