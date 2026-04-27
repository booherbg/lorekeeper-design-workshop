import { describe, it, expect, beforeEach } from "vitest";
import { cleanDb, createTestWorld, createTestCharacter } from "./helpers";
import {
  createCharacter,
  listCharacters,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
} from "../src/services/character-service";
import { deleteWorld } from "../src/services/world-service";

let worldId: number;

beforeEach(async () => {
  await cleanDb();
  const world = await createTestWorld();
  worldId = world.id;
});

describe("createCharacter", () => {
  it("creates with valid input", async () => {
    const char = await createCharacter(worldId, {
      name: "Elara",
      description: "A wandering healer",
    });
    expect(char.id).toBeDefined();
    expect(char.name).toBe("Elara");
    expect(char.worldId).toBe(worldId);
  });

  it("throws when name is missing", async () => {
    await expect(
      createCharacter(worldId, { name: "", description: "desc" })
    ).rejects.toThrow("Name is required");
  });

  it("throws when description is missing", async () => {
    await expect(
      createCharacter(worldId, { name: "Elara", description: "" })
    ).rejects.toThrow("Description is required");
  });

  it("throws for nonexistent world", async () => {
    await expect(
      createCharacter(99999, { name: "Elara", description: "desc" })
    ).rejects.toThrow("World not found");
  });

  it("trims whitespace from name", async () => {
    const char = await createCharacter(worldId, {
      name: "  Elara  ",
      description: "desc",
    });
    expect(char.name).toBe("Elara");
  });
});

describe("listCharacters", () => {
  it("returns empty array when no characters exist", async () => {
    const chars = await listCharacters(worldId);
    expect(chars).toEqual([]);
  });

  it("returns only characters in the specified world", async () => {
    await createTestCharacter(worldId, { name: "Char A" });
    const otherWorld = await createTestWorld({ name: "Other World" });
    await createTestCharacter(otherWorld.id, { name: "Char B" });
    const chars = await listCharacters(worldId);
    expect(chars).toHaveLength(1);
    expect(chars[0].name).toBe("Char A");
  });
});

describe("getCharacterById", () => {
  it("returns the character", async () => {
    const created = await createTestCharacter(worldId);
    const found = await getCharacterById(worldId, created.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test Character");
  });

  it("returns null for wrong world", async () => {
    const created = await createTestCharacter(worldId);
    const otherWorld = await createTestWorld({ name: "Other" });
    const found = await getCharacterById(otherWorld.id, created.id);
    expect(found).toBeNull();
  });

  it("returns null for nonexistent id", async () => {
    const found = await getCharacterById(worldId, 99999);
    expect(found).toBeNull();
  });
});

describe("updateCharacter", () => {
  it("updates with valid input", async () => {
    const char = await createTestCharacter(worldId);
    const updated = await updateCharacter(worldId, char.id, {
      name: "Updated",
      description: "New desc",
    });
    expect(updated.name).toBe("Updated");
    expect(updated.description).toBe("New desc");
  });

  it("throws for nonexistent character", async () => {
    await expect(
      updateCharacter(worldId, 99999, { name: "X" })
    ).rejects.toThrow("Character not found");
  });
});

describe("deleteCharacter", () => {
  it("deletes the character", async () => {
    const char = await createTestCharacter(worldId);
    await deleteCharacter(worldId, char.id);
    const found = await getCharacterById(worldId, char.id);
    expect(found).toBeNull();
  });

  it("throws for nonexistent character", async () => {
    await expect(deleteCharacter(worldId, 99999)).rejects.toThrow(
      "Character not found"
    );
  });
});

describe("cascade delete", () => {
  it("deleting a world removes its characters", async () => {
    const char = await createTestCharacter(worldId);
    await deleteWorld(worldId);
    const found = await getCharacterById(worldId, char.id);
    expect(found).toBeNull();
  });
});
