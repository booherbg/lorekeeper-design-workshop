import { describe, it, expect, beforeEach } from "vitest";
import {
  cleanDb,
  createTestWorld,
  createTestCharacter,
  createTestLocation,
  createTestStory,
} from "./helpers";
import { getWorldContext } from "../src/services/context-service";
import { createLoreArtifact, updateLoreStatus } from "../src/services/lore-service";

let worldId: number;

beforeEach(async () => {
  await cleanDb();
  const world = await createTestWorld();
  worldId = world.id;
});

describe("getWorldContext", () => {
  it("returns world info", async () => {
    const ctx = await getWorldContext(worldId);
    expect(ctx.world.name).toBe("Test World");
    expect(ctx.world.description).toBe("A test world");
  });

  it("returns characters", async () => {
    await createTestCharacter(worldId, { name: "Hero" });
    await createTestCharacter(worldId, { name: "Villain" });
    const ctx = await getWorldContext(worldId);
    expect(ctx.characters).toHaveLength(2);
  });

  it("returns locations", async () => {
    await createTestLocation(worldId, { name: "Castle" });
    const ctx = await getWorldContext(worldId);
    expect(ctx.locations).toHaveLength(1);
    expect(ctx.locations[0].name).toBe("Castle");
  });

  it("returns only kept lore", async () => {
    const story = await createTestStory(worldId);
    const kept = await createLoreArtifact(worldId, {
      storyId: story.id,
      content: "Kept lore",
      characterId: null,
      locationId: null,
    });
    await createLoreArtifact(worldId, {
      storyId: story.id,
      content: "Pending lore",
      characterId: null,
      locationId: null,
    });
    const discarded = await createLoreArtifact(worldId, {
      storyId: story.id,
      content: "Discarded lore",
      characterId: null,
      locationId: null,
    });
    await updateLoreStatus(worldId, kept.id, "kept");
    await updateLoreStatus(worldId, discarded.id, "discarded");

    const ctx = await getWorldContext(worldId);
    expect(ctx.lore).toHaveLength(1);
    expect(ctx.lore[0].content).toBe("Kept lore");
  });

  it("returns recent stories with content preview", async () => {
    for (let i = 1; i <= 7; i++) {
      await createTestStory(worldId, { title: `Story ${i}` });
    }
    const ctx = await getWorldContext(worldId);
    expect(ctx.recentStories).toHaveLength(5);
    expect(ctx.recentStories[0].title).toBe("Story 7");
  });

  it("truncates content preview to 200 chars", async () => {
    const longContent = "A".repeat(300);
    await createTestStory(worldId, { content: longContent });
    const ctx = await getWorldContext(worldId);
    expect(ctx.recentStories[0].contentPreview.length).toBe(200);
  });

  it("throws for nonexistent world", async () => {
    await expect(getWorldContext(99999)).rejects.toThrow("World not found");
  });

  it("returns empty arrays when world has no content", async () => {
    const ctx = await getWorldContext(worldId);
    expect(ctx.characters).toEqual([]);
    expect(ctx.locations).toEqual([]);
    expect(ctx.lore).toEqual([]);
    expect(ctx.recentStories).toEqual([]);
  });
});
