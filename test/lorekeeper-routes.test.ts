import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanDb, createTestApp } from "./helpers";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeEach(async () => {
  await cleanDb();
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("GET /lorekeeper", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/lorekeeper" });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /setup", () => {
  it("returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/setup" });
    expect(res.statusCode).toBe(200);
  });
});
