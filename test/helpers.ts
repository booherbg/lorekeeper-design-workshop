import { prisma } from "../src/db";
import { buildApp } from "../src/app";
import { createWorld } from "../src/services/world-service";

export async function cleanDb() {
  await prisma.world.deleteMany();
}

export async function createTestApp() {
  return buildApp();
}

export async function createTestWorld(overrides: Record<string, unknown> = {}) {
  return createWorld({
    name: "Test World",
    description: "A test world",
    ...overrides,
  } as { name: string; description?: string });
}
