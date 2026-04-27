import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  createWorld,
  listWorlds,
  getWorldWithCounts,
  updateWorld,
  deleteWorld,
} from "./services/world-service";
import {
  createCharacter,
  listCharacters,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
} from "./services/character-service";
import {
  createLocation,
  listLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} from "./services/location-service";
import {
  createStory,
  listStories,
  getStoryById,
  deleteStory,
} from "./services/story-service";
import {
  createLoreArtifacts,
  listLoreArtifacts,
  updateLoreStatus,
} from "./services/lore-service";
import { getWorldContext } from "./services/context-service";

export function createMcpServer() {
  const server = new McpServer({
    name: "lorekeeper",
    version: "1.0.0",
  });

  // --- World tools ---

  server.tool("list_worlds", "List all worlds", {}, async () => {
    const worlds = await listWorlds();
    return { content: [{ type: "text", text: JSON.stringify(worlds, null, 2) }] };
  });

  server.tool("get_world", "Get world details and summary stats", { worldId: z.number() }, async ({ worldId }) => {
    const world = await getWorldWithCounts(worldId);
    if (!world) return { content: [{ type: "text", text: "World not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(world, null, 2) }] };
  });

  server.tool("create_world", "Create a new world", {
    name: z.string(),
    description: z.string().optional(),
  }, async ({ name, description }) => {
    const world = await createWorld({ name, description: description ?? null });
    return { content: [{ type: "text", text: JSON.stringify(world, null, 2) }] };
  });

  server.tool("update_world", "Update world name/description", {
    worldId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
  }, async ({ worldId, name, description }) => {
    const world = await updateWorld(worldId, { name, description });
    return { content: [{ type: "text", text: JSON.stringify(world, null, 2) }] };
  });

  server.tool("delete_world", "Delete a world and all its contents", { worldId: z.number() }, async ({ worldId }) => {
    await deleteWorld(worldId);
    return { content: [{ type: "text", text: "World deleted" }] };
  });

  // --- Character tools ---

  server.tool("list_characters", "List characters in a world", { worldId: z.number() }, async ({ worldId }) => {
    const characters = await listCharacters(worldId);
    return { content: [{ type: "text", text: JSON.stringify(characters, null, 2) }] };
  });

  server.tool("get_character", "Get character with full description", {
    worldId: z.number(),
    characterId: z.number(),
  }, async ({ worldId, characterId }) => {
    const character = await getCharacterById(worldId, characterId);
    if (!character) return { content: [{ type: "text", text: "Character not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(character, null, 2) }] };
  });

  server.tool("create_character", "Create a character in a world", {
    worldId: z.number(),
    name: z.string(),
    description: z.string(),
  }, async ({ worldId, name, description }) => {
    const character = await createCharacter(worldId, { name, description });
    return { content: [{ type: "text", text: JSON.stringify(character, null, 2) }] };
  });

  server.tool("update_character", "Update character name/description", {
    worldId: z.number(),
    characterId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
  }, async ({ worldId, characterId, name, description }) => {
    const character = await updateCharacter(worldId, characterId, { name, description });
    return { content: [{ type: "text", text: JSON.stringify(character, null, 2) }] };
  });

  server.tool("delete_character", "Delete a character", {
    worldId: z.number(),
    characterId: z.number(),
  }, async ({ worldId, characterId }) => {
    await deleteCharacter(worldId, characterId);
    return { content: [{ type: "text", text: "Character deleted" }] };
  });

  // --- Location tools ---

  server.tool("list_locations", "List locations in a world", { worldId: z.number() }, async ({ worldId }) => {
    const locations = await listLocations(worldId);
    return { content: [{ type: "text", text: JSON.stringify(locations, null, 2) }] };
  });

  server.tool("get_location", "Get location with full description", {
    worldId: z.number(),
    locationId: z.number(),
  }, async ({ worldId, locationId }) => {
    const location = await getLocationById(worldId, locationId);
    if (!location) return { content: [{ type: "text", text: "Location not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(location, null, 2) }] };
  });

  server.tool("create_location", "Create a location in a world", {
    worldId: z.number(),
    name: z.string(),
    description: z.string(),
  }, async ({ worldId, name, description }) => {
    const location = await createLocation(worldId, { name, description });
    return { content: [{ type: "text", text: JSON.stringify(location, null, 2) }] };
  });

  server.tool("update_location", "Update location name/description", {
    worldId: z.number(),
    locationId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
  }, async ({ worldId, locationId, name, description }) => {
    const location = await updateLocation(worldId, locationId, { name, description });
    return { content: [{ type: "text", text: JSON.stringify(location, null, 2) }] };
  });

  server.tool("delete_location", "Delete a location", {
    worldId: z.number(),
    locationId: z.number(),
  }, async ({ worldId, locationId }) => {
    await deleteLocation(worldId, locationId);
    return { content: [{ type: "text", text: "Location deleted" }] };
  });

  // --- Story tools ---

  server.tool("list_stories", "List stories in a world", { worldId: z.number() }, async ({ worldId }) => {
    const stories = await listStories(worldId);
    return { content: [{ type: "text", text: JSON.stringify(stories, null, 2) }] };
  });

  server.tool("get_story", "Get story with characters, locations, lore artifacts", {
    worldId: z.number(),
    storyId: z.number(),
  }, async ({ worldId, storyId }) => {
    const story = await getStoryById(worldId, storyId);
    if (!story) return { content: [{ type: "text", text: "Story not found" }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(story, null, 2) }] };
  });

  server.tool("delete_story", "Delete a story", {
    worldId: z.number(),
    storyId: z.number(),
  }, async ({ worldId, storyId }) => {
    await deleteStory(worldId, storyId);
    return { content: [{ type: "text", text: "Story deleted" }] };
  });

  // --- Generation tools ---

  server.tool("get_world_context", "Assemble full world context for AI story generation", {
    worldId: z.number(),
  }, async ({ worldId }) => {
    const context = await getWorldContext(worldId);
    return { content: [{ type: "text", text: JSON.stringify(context, null, 2) }] };
  });

  server.tool("save_story", "Save a generated story with linked characters and locations", {
    worldId: z.number(),
    title: z.string(),
    content: z.string(),
    prompt: z.string(),
    characterIds: z.array(z.number()),
    locationIds: z.array(z.number()),
  }, async ({ worldId, title, content, prompt, characterIds, locationIds }) => {
    const story = await createStory(worldId, { title, content, prompt, characterIds, locationIds });
    return { content: [{ type: "text", text: JSON.stringify(story, null, 2) }] };
  });

  server.tool("save_lore_artifacts", "Save a batch of lore artifacts from a story (all created as pending)", {
    worldId: z.number(),
    storyId: z.number(),
    artifacts: z.array(z.object({
      content: z.string(),
      characterId: z.number().nullable(),
      locationId: z.number().nullable(),
    })),
  }, async ({ worldId, storyId, artifacts }) => {
    const items = artifacts.map((a) => ({
      storyId,
      content: a.content,
      characterId: a.characterId,
      locationId: a.locationId,
    }));
    const created = await createLoreArtifacts(worldId, items);
    return { content: [{ type: "text", text: JSON.stringify(created, null, 2) }] };
  });

  // --- Lore tools ---

  server.tool("list_lore", "List lore artifacts, filterable by status, character, location", {
    worldId: z.number(),
    status: z.enum(["pending", "kept", "discarded"]).optional(),
  }, async ({ worldId, status }) => {
    const lore = await listLoreArtifacts(worldId, status ? { status } : {});
    return { content: [{ type: "text", text: JSON.stringify(lore, null, 2) }] };
  });

  server.tool("update_lore_status", "Change artifact status (keep/discard)", {
    worldId: z.number(),
    loreId: z.number(),
    status: z.enum(["pending", "kept", "discarded"]),
  }, async ({ worldId, loreId, status }) => {
    const updated = await updateLoreStatus(worldId, loreId, status);
    return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
  });

  // --- Advisory tools ---

  server.tool("check_consistency", "Return world context structured for consistency review", {
    worldId: z.number(),
  }, async ({ worldId }) => {
    const context = await getWorldContext(worldId);
    return { content: [{ type: "text", text: JSON.stringify({
      instruction: "Review this world data for inconsistencies, contradictions, or gaps. The data below is the current state — analyze it and report findings.",
      ...context,
    }, null, 2) }] };
  });

  server.tool("suggest_connections", "Return characters and locations with descriptions and existing relationships", {
    worldId: z.number(),
  }, async ({ worldId }) => {
    const context = await getWorldContext(worldId);
    return { content: [{ type: "text", text: JSON.stringify({
      instruction: "Review these characters and locations. Suggest potential connections, relationships, or interactions that could enrich the world. The data below shows what exists — identify what's missing.",
      characters: context.characters,
      locations: context.locations,
      lore: context.lore,
    }, null, 2) }] };
  });

  return server;
}
