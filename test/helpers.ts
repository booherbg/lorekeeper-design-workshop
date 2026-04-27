import { prisma } from "../src/db";
import { buildApp } from "../src/app";
import { createWorld } from "../src/services/world-service";
import { createCharacter } from "../src/services/character-service";
import { createLocation } from "../src/services/location-service";
import { createStory } from "../src/services/story-service";

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

export async function createTestStory(
  worldId: number,
  overrides: Record<string, unknown> = {}
) {
  return createStory(worldId, {
    title: "Test Story",
    content: "Once upon a time in a test world...",
    prompt: "Tell me a test story",
    characterIds: [],
    locationIds: [],
    ...overrides,
  } as { title: string; content: string; prompt: string; characterIds: number[]; locationIds: number[] });
}
