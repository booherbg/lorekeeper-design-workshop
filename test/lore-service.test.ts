import { describe, it, expect, beforeEach } from "vitest";
import {
  cleanDb,
  createTestWorld,
  createTestCharacter,
  createTestLocation,
  createTestStory,
} from "./helpers";
import {
  createLoreArtifact,
  createLoreArtifacts,
  listLoreArtifacts,
  updateLoreStatus,
} from "../src/services/lore-service";
import { deleteWorld } from "../src/services/world-service";
import { deleteStory } from "../src/services/story-service";
import { deleteCharacter } from "../src/services/character-service";

let worldId: number;
let storyId: number;

beforeEach(async () => {
  await cleanDb();
  const world = await createTestWorld();
  worldId = world.id;
  const story = await createTestStory(worldId);
  storyId = story.id;
});

describe("createLoreArtifact", () => {
  it("creates with valid input", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "The blacksmith taps three times",
      characterId: null,
      locationId: null,
    });
    expect(lore.id).toBeDefined();
    expect(lore.status).toBe("pending");
    expect(lore.worldId).toBe(worldId);
  });

  it("creates with optional character link", async () => {
    const char = await createTestCharacter(worldId);
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "A habit of the hero",
      characterId: char.id,
      locationId: null,
    });
    expect(lore.characterId).toBe(char.id);
  });

  it("creates with optional location link", async () => {
    const loc = await createTestLocation(worldId);
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "The forge smells of copper",
      characterId: null,
      locationId: loc.id,
    });
    expect(lore.locationId).toBe(loc.id);
  });

  it("throws when content is missing", async () => {
    await expect(
      createLoreArtifact(worldId, {
        storyId,
        content: "",
        characterId: null,
        locationId: null,
      })
    ).rejects.toThrow("Content is required");
  });

  it("throws for nonexistent world", async () => {
    await expect(
      createLoreArtifact(99999, {
        storyId,
        content: "content",
        characterId: null,
        locationId: null,
      })
    ).rejects.toThrow("World not found");
  });

  it("throws for nonexistent story", async () => {
    await expect(
      createLoreArtifact(worldId, {
        storyId: 99999,
        content: "content",
        characterId: null,
        locationId: null,
      })
    ).rejects.toThrow("Story not found");
  });
});

describe("createLoreArtifacts (batch)", () => {
  it("creates multiple artifacts all with pending status", async () => {
    const artifacts = await createLoreArtifacts(worldId, [
      { storyId, content: "Lore one", characterId: null, locationId: null },
      { storyId, content: "Lore two", characterId: null, locationId: null },
      { storyId, content: "Lore three", characterId: null, locationId: null },
    ]);
    expect(artifacts).toHaveLength(3);
    artifacts.forEach((a) => expect(a.status).toBe("pending"));
  });

  it("returns empty array for empty input", async () => {
    const artifacts = await createLoreArtifacts(worldId, []);
    expect(artifacts).toEqual([]);
  });
});

describe("listLoreArtifacts", () => {
  it("returns empty array when none exist", async () => {
    const lore = await listLoreArtifacts(worldId);
    expect(lore).toEqual([]);
  });

  it("returns all artifacts in the world", async () => {
    await createLoreArtifact(worldId, {
      storyId,
      content: "lore",
      characterId: null,
      locationId: null,
    });
    const lore = await listLoreArtifacts(worldId);
    expect(lore).toHaveLength(1);
  });

  it("filters by status", async () => {
    const a = await createLoreArtifact(worldId, {
      storyId,
      content: "pending one",
      characterId: null,
      locationId: null,
    });
    await createLoreArtifact(worldId, {
      storyId,
      content: "pending two",
      characterId: null,
      locationId: null,
    });
    await updateLoreStatus(worldId, a.id, "kept");

    const kept = await listLoreArtifacts(worldId, { status: "kept" });
    expect(kept).toHaveLength(1);
    expect(kept[0].content).toBe("pending one");

    const pending = await listLoreArtifacts(worldId, { status: "pending" });
    expect(pending).toHaveLength(1);
  });

  it("returns only artifacts in the specified world", async () => {
    const otherWorld = await createTestWorld({ name: "Other" });
    const otherStory = await createTestStory(otherWorld.id);
    await createLoreArtifact(worldId, {
      storyId,
      content: "mine",
      characterId: null,
      locationId: null,
    });
    await createLoreArtifact(otherWorld.id, {
      storyId: otherStory.id,
      content: "theirs",
      characterId: null,
      locationId: null,
    });
    const lore = await listLoreArtifacts(worldId);
    expect(lore).toHaveLength(1);
    expect(lore[0].content).toBe("mine");
  });
});

describe("updateLoreStatus", () => {
  it("updates to kept", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "keeper",
      characterId: null,
      locationId: null,
    });
    const updated = await updateLoreStatus(worldId, lore.id, "kept");
    expect(updated.status).toBe("kept");
  });

  it("updates to discarded", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "discard me",
      characterId: null,
      locationId: null,
    });
    const updated = await updateLoreStatus(worldId, lore.id, "discarded");
    expect(updated.status).toBe("discarded");
  });

  it("allows re-keeping a discarded artifact", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "changed mind",
      characterId: null,
      locationId: null,
    });
    await updateLoreStatus(worldId, lore.id, "discarded");
    const updated = await updateLoreStatus(worldId, lore.id, "kept");
    expect(updated.status).toBe("kept");
  });

  it("throws for invalid status", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "content",
      characterId: null,
      locationId: null,
    });
    await expect(
      updateLoreStatus(worldId, lore.id, "invalid" as any)
    ).rejects.toThrow("Status must be one of: pending, kept, discarded");
  });

  it("throws for nonexistent artifact", async () => {
    await expect(
      updateLoreStatus(worldId, 99999, "kept")
    ).rejects.toThrow("Lore artifact not found");
  });

  it("throws for wrong world", async () => {
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "content",
      characterId: null,
      locationId: null,
    });
    const otherWorld = await createTestWorld({ name: "Other" });
    await expect(
      updateLoreStatus(otherWorld.id, lore.id, "kept")
    ).rejects.toThrow("Lore artifact not found");
  });
});

describe("cascade delete", () => {
  it("deleting a world removes its lore artifacts", async () => {
    await createLoreArtifact(worldId, {
      storyId,
      content: "gone",
      characterId: null,
      locationId: null,
    });
    await deleteWorld(worldId);
    const lore = await listLoreArtifacts(worldId);
    expect(lore).toEqual([]);
  });

  it("deleting a story removes its lore artifacts", async () => {
    await createLoreArtifact(worldId, {
      storyId,
      content: "gone with story",
      characterId: null,
      locationId: null,
    });
    await deleteStory(worldId, storyId);
    const lore = await listLoreArtifacts(worldId);
    expect(lore).toEqual([]);
  });

  it("deleting a character nullifies characterId on lore", async () => {
    const char = await createTestCharacter(worldId);
    const lore = await createLoreArtifact(worldId, {
      storyId,
      content: "char lore",
      characterId: char.id,
      locationId: null,
    });
    await deleteCharacter(worldId, char.id);
    const all = await listLoreArtifacts(worldId);
    expect(all).toHaveLength(1);
    expect(all[0].characterId).toBeNull();
  });
});
