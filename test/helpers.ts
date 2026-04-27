import { prisma } from "../src/db";
import { buildApp } from "../src/app";
import { createWorld } from "../src/services/world-service";
import { createCharacter } from "../src/services/character-service";
import { createLocation } from "../src/services/location-service";

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

export async function createTestCharacter(worldId: number, overrides: Record<string, unknown> = {}) {
  return createCharacter(worldId, {
    name: "Test Character",
    description: "A test character",
    ...overrides,
  } as { name: string; description: string });
}

export async function createTestLocation(worldId: number, overrides: Record<string, unknown> = {}) {
  return createLocation(worldId, {
    name: "Test Location",
    description: "A test location",
    ...overrides,
  } as { name: string; description: string });
}
