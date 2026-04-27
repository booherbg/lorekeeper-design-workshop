import { describe, it, expect, beforeEach } from "vitest";
import { cleanDb, createTestWorld, createTestLocation } from "./helpers";
import {
  createLocation,
  listLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} from "../src/services/location-service";
import { deleteWorld } from "../src/services/world-service";

let worldId: number;

beforeEach(async () => {
  await cleanDb();
  const world = await createTestWorld();
  worldId = world.id;
});

describe("createLocation", () => {
  it("creates with valid input", async () => {
    const loc = await createLocation(worldId, {
      name: "The Forge",
      description: "A blacksmith's workshop",
    });
    expect(loc.id).toBeDefined();
    expect(loc.name).toBe("The Forge");
    expect(loc.worldId).toBe(worldId);
  });

  it("throws when name is missing", async () => {
    await expect(
      createLocation(worldId, { name: "", description: "desc" })
    ).rejects.toThrow("Name is required");
  });

  it("throws when description is missing", async () => {
    await expect(
      createLocation(worldId, { name: "Forge", description: "" })
    ).rejects.toThrow("Description is required");
  });

  it("throws for nonexistent world", async () => {
    await expect(
      createLocation(99999, { name: "Forge", description: "desc" })
    ).rejects.toThrow("World not found");
  });
});

describe("listLocations", () => {
  it("returns empty array when no locations exist", async () => {
    const locs = await listLocations(worldId);
    expect(locs).toEqual([]);
  });

  it("returns only locations in the specified world", async () => {
    await createTestLocation(worldId, { name: "Loc A" });
    const otherWorld = await createTestWorld({ name: "Other" });
    await createTestLocation(otherWorld.id, { name: "Loc B" });
    const locs = await listLocations(worldId);
    expect(locs).toHaveLength(1);
    expect(locs[0].name).toBe("Loc A");
  });
});

describe("getLocationById", () => {
  it("returns the location", async () => {
    const created = await createTestLocation(worldId);
    const found = await getLocationById(worldId, created.id);
    expect(found).not.toBeNull();
  });

  it("returns null for wrong world", async () => {
    const created = await createTestLocation(worldId);
    const otherWorld = await createTestWorld({ name: "Other" });
    const found = await getLocationById(otherWorld.id, created.id);
    expect(found).toBeNull();
  });
});

describe("updateLocation", () => {
  it("updates with valid input", async () => {
    const loc = await createTestLocation(worldId);
    const updated = await updateLocation(worldId, loc.id, {
      name: "Updated",
      description: "New desc",
    });
    expect(updated.name).toBe("Updated");
  });

  it("throws for nonexistent location", async () => {
    await expect(
      updateLocation(worldId, 99999, { name: "X" })
    ).rejects.toThrow("Location not found");
  });
});

describe("deleteLocation", () => {
  it("deletes the location", async () => {
    const loc = await createTestLocation(worldId);
    await deleteLocation(worldId, loc.id);
    const found = await getLocationById(worldId, loc.id);
    expect(found).toBeNull();
  });
});

describe("cascade delete", () => {
  it("deleting a world removes its locations", async () => {
    const loc = await createTestLocation(worldId);
    await deleteWorld(worldId);
    const found = await getLocationById(worldId, loc.id);
    expect(found).toBeNull();
  });
});
