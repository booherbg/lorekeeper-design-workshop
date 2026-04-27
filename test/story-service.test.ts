import { describe, it, expect, beforeEach } from "vitest";
import {
  cleanDb,
  createTestWorld,
  createTestCharacter,
  createTestLocation,
} from "./helpers";
import {
  createStory,
  listStories,
  getStoryById,
  deleteStory,
} from "../src/services/story-service";
import { deleteWorld } from "../src/services/world-service";
import { deleteCharacter } from "../src/services/character-service";

let worldId: number;

beforeEach(async () => {
  await cleanDb();
  const world = await createTestWorld();
  worldId = world.id;
});

describe("createStory", () => {
  it("creates with valid input", async () => {
    const story = await createStory(worldId, {
      title: "The First Tale",
      content: "Once upon a time...",
      prompt: "Tell me a story",
      characterIds: [],
      locationIds: [],
    });
    expect(story.id).toBeDefined();
    expect(story.title).toBe("The First Tale");
    expect(story.worldId).toBe(worldId);
  });

  it("creates with linked characters and locations", async () => {
    const char = await createTestCharacter(worldId);
    const loc = await createTestLocation(worldId);
    const story = await createStory(worldId, {
      title: "A Story",
      content: "Content",
      prompt: "Prompt",
      characterIds: [char.id],
      locationIds: [loc.id],
    });
    expect(story.storyCharacters).toHaveLength(1);
    expect(story.storyCharacters[0].characterId).toBe(char.id);
    expect(story.storyLocations).toHaveLength(1);
    expect(story.storyLocations[0].locationId).toBe(loc.id);
  });

  it("throws when title is missing", async () => {
    await expect(
      createStory(worldId, {
        title: "",
        content: "content",
        prompt: "prompt",
        characterIds: [],
        locationIds: [],
      })
    ).rejects.toThrow("Title is required");
  });

  it("throws when content is missing", async () => {
    await expect(
      createStory(worldId, {
        title: "Title",
        content: "",
        prompt: "prompt",
        characterIds: [],
        locationIds: [],
      })
    ).rejects.toThrow("Content is required");
  });

  it("throws when prompt is missing", async () => {
    await expect(
      createStory(worldId, {
        title: "Title",
        content: "content",
        prompt: "",
        characterIds: [],
        locationIds: [],
      })
    ).rejects.toThrow("Prompt is required");
  });

  it("throws for nonexistent world", async () => {
    await expect(
      createStory(99999, {
        title: "Title",
        content: "content",
        prompt: "prompt",
        characterIds: [],
        locationIds: [],
      })
    ).rejects.toThrow("World not found");
  });

  it("throws when characterIds belong to a different world", async () => {
    const otherWorld = await createTestWorld({ name: "Other" });
    const char = await createTestCharacter(otherWorld.id);
    await expect(
      createStory(worldId, {
        title: "Title",
        content: "content",
        prompt: "prompt",
        characterIds: [char.id],
        locationIds: [],
      })
    ).rejects.toThrow("Character IDs must belong to this world");
  });

  it("throws when locationIds belong to a different world", async () => {
    const otherWorld = await createTestWorld({ name: "Other" });
    const loc = await createTestLocation(otherWorld.id);
    await expect(
      createStory(worldId, {
        title: "Title",
        content: "content",
        prompt: "prompt",
        characterIds: [],
        locationIds: [loc.id],
      })
    ).rejects.toThrow("Location IDs must belong to this world");
  });

  it("trims whitespace from title", async () => {
    const story = await createStory(worldId, {
      title: "  Trimmed  ",
      content: "content",
      prompt: "prompt",
      characterIds: [],
      locationIds: [],
    });
    expect(story.title).toBe("Trimmed");
  });
});

describe("listStories", () => {
  it("returns empty array when no stories exist", async () => {
    const stories = await listStories(worldId);
    expect(stories).toEqual([]);
  });

  it("returns stories newest first with character names", async () => {
    const char = await createTestCharacter(worldId);
    await createStory(worldId, {
      title: "First",
      content: "content",
      prompt: "prompt",
      characterIds: [],
      locationIds: [],
    });
    await createStory(worldId, {
      title: "Second",
      content: "content",
      prompt: "prompt",
      characterIds: [char.id],
      locationIds: [],
    });
    const stories = await listStories(worldId);
    expect(stories).toHaveLength(2);
    expect(stories[0].title).toBe("Second");
    expect(stories[1].title).toBe("First");
  });

  it("returns only stories in the specified world", async () => {
    const otherWorld = await createTestWorld({ name: "Other" });
    await createStory(worldId, {
      title: "Mine",
      content: "c",
      prompt: "p",
      characterIds: [],
      locationIds: [],
    });
    await createStory(otherWorld.id, {
      title: "Theirs",
      content: "c",
      prompt: "p",
      characterIds: [],
      locationIds: [],
    });
    const stories = await listStories(worldId);
    expect(stories).toHaveLength(1);
    expect(stories[0].title).toBe("Mine");
  });
});

describe("getStoryById", () => {
  it("returns story with linked characters and locations", async () => {
    const char = await createTestCharacter(worldId);
    const loc = await createTestLocation(worldId);
    const created = await createStory(worldId, {
      title: "A Story",
      content: "Content",
      prompt: "Prompt",
      characterIds: [char.id],
      locationIds: [loc.id],
    });
    const story = await getStoryById(worldId, created.id);
    expect(story).not.toBeNull();
    expect(story!.storyCharacters[0].character.name).toBe("Test Character");
    expect(story!.storyLocations[0].location.name).toBe("Test Location");
  });

  it("returns null for wrong world", async () => {
    const created = await createStory(worldId, {
      title: "A Story",
      content: "c",
      prompt: "p",
      characterIds: [],
      locationIds: [],
    });
    const otherWorld = await createTestWorld({ name: "Other" });
    const found = await getStoryById(otherWorld.id, created.id);
    expect(found).toBeNull();
  });

  it("returns null for nonexistent id", async () => {
    const found = await getStoryById(worldId, 99999);
    expect(found).toBeNull();
  });
});

describe("deleteStory", () => {
  it("deletes the story", async () => {
    const story = await createStory(worldId, {
      title: "Doomed",
      content: "c",
      prompt: "p",
      characterIds: [],
      locationIds: [],
    });
    await deleteStory(worldId, story.id);
    const found = await getStoryById(worldId, story.id);
    expect(found).toBeNull();
  });

  it("throws for nonexistent story", async () => {
    await expect(deleteStory(worldId, 99999)).rejects.toThrow("Story not found");
  });
});

describe("cascade delete", () => {
  it("deleting a world removes its stories", async () => {
    const story = await createStory(worldId, {
      title: "Gone",
      content: "c",
      prompt: "p",
      characterIds: [],
      locationIds: [],
    });
    await deleteWorld(worldId);
    const found = await getStoryById(worldId, story.id);
    expect(found).toBeNull();
  });

  it("deleting a character removes join records but not the story", async () => {
    const char = await createTestCharacter(worldId);
    const story = await createStory(worldId, {
      title: "Survives",
      content: "c",
      prompt: "p",
      characterIds: [char.id],
      locationIds: [],
    });
    await deleteCharacter(worldId, char.id);
    const found = await getStoryById(worldId, story.id);
    expect(found).not.toBeNull();
    expect(found!.storyCharacters).toHaveLength(0);
  });
});
