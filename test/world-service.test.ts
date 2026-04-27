import { describe, it, expect, beforeEach } from "vitest";
import { cleanDb, createTestWorld } from "./helpers";
import {
  createWorld,
  listWorlds,
  getWorldById,
  updateWorld,
  deleteWorld,
} from "../src/services/world-service";

beforeEach(async () => {
  await cleanDb();
});

describe("createWorld", () => {
  it("creates a world with valid input", async () => {
    const world = await createWorld({
      name: "Eldoria",
      description: "A land of ancient magic",
    });
    expect(world.id).toBeDefined();
    expect(world.name).toBe("Eldoria");
    expect(world.description).toBe("A land of ancient magic");
    expect(world.createdAt).toBeInstanceOf(Date);
  });

  it("throws when name is missing", async () => {
    await expect(createWorld({ name: "" })).rejects.toThrow("Name is required");
  });

  it("throws when name is whitespace only", async () => {
    await expect(createWorld({ name: "   " })).rejects.toThrow(
      "Name is required"
    );
  });

  it("trims whitespace from name", async () => {
    const world = await createWorld({ name: "  Eldoria  " });
    expect(world.name).toBe("Eldoria");
  });

  it("creates with null description", async () => {
    const world = await createWorld({ name: "Eldoria" });
    expect(world.description).toBeNull();
  });

  it("throws when name exceeds 255 characters", async () => {
    const longName = "a".repeat(256);
    await expect(createWorld({ name: longName })).rejects.toThrow(
      "255 characters"
    );
  });
});

describe("listWorlds", () => {
  it("returns empty array when no worlds exist", async () => {
    const worlds = await listWorlds();
    expect(worlds).toEqual([]);
  });

  it("returns all worlds", async () => {
    await createTestWorld({ name: "World A" });
    await createTestWorld({ name: "World B" });
    const worlds = await listWorlds();
    expect(worlds).toHaveLength(2);
  });
});

describe("getWorldById", () => {
  it("returns the world by id", async () => {
    const created = await createTestWorld();
    const found = await getWorldById(created.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test World");
  });

  it("returns null for nonexistent id", async () => {
    const found = await getWorldById(99999);
    expect(found).toBeNull();
  });
});

describe("updateWorld", () => {
  it("updates with valid input", async () => {
    const world = await createTestWorld();
    const updated = await updateWorld(world.id, {
      name: "Updated",
      description: "New desc",
    });
    expect(updated.name).toBe("Updated");
    expect(updated.description).toBe("New desc");
  });

  it("throws for nonexistent id", async () => {
    await expect(updateWorld(99999, { name: "X" })).rejects.toThrow(
      "World not found"
    );
  });

  it("validates name on update", async () => {
    const world = await createTestWorld();
    await expect(updateWorld(world.id, { name: "" })).rejects.toThrow(
      "Name is required"
    );
  });
});

describe("deleteWorld", () => {
  it("deletes the world", async () => {
    const world = await createTestWorld();
    await deleteWorld(world.id);
    const found = await getWorldById(world.id);
    expect(found).toBeNull();
  });

  it("throws for nonexistent id", async () => {
    await expect(deleteWorld(99999)).rejects.toThrow("World not found");
  });
});
