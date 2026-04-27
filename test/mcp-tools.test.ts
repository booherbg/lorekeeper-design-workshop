import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  cleanDb,
  createTestWorld,
  createTestCharacter,
  createTestLocation,
  createTestStory,
} from "./helpers";
import { createLoreArtifact } from "../src/services/lore-service";
import path from "node:path";

let client: Client;
let transport: StdioClientTransport;

beforeEach(async () => {
  await cleanDb();

  transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", path.join(__dirname, "../src/mcp-server.ts")],
    env: {
      ...process.env,
      DATABASE_URL: "file:./test.db",
    },
  });

  client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(transport);
});

afterAll(async () => {
  try {
    await client.close();
  } catch {}
});

async function callTool(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as any)[0]?.text;
  if (result.isError) throw new Error(text);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

describe("world tools", () => {
  it("creates and lists worlds", async () => {
    const world = await callTool("create_world", { name: "MCP World", description: "Created via MCP" });
    expect(world.name).toBe("MCP World");

    const worlds = await callTool("list_worlds");
    expect(worlds).toHaveLength(1);
  });

  it("gets world with counts", async () => {
    const world = await createTestWorld();
    const result = await callTool("get_world", { worldId: world.id });
    expect(result.name).toBe("Test World");
    expect(result.characterCount).toBe(0);
  });

  it("deletes a world", async () => {
    const world = await createTestWorld();
    await callTool("delete_world", { worldId: world.id });
    const worlds = await callTool("list_worlds");
    expect(worlds).toHaveLength(0);
  });
});

describe("character tools", () => {
  it("creates and lists characters", async () => {
    const world = await createTestWorld();
    await callTool("create_character", { worldId: world.id, name: "Hero", description: "Brave" });
    const chars = await callTool("list_characters", { worldId: world.id });
    expect(chars).toHaveLength(1);
    expect(chars[0].name).toBe("Hero");
  });
});

describe("story tools", () => {
  it("saves and retrieves a story with links", async () => {
    const world = await createTestWorld();
    const char = await createTestCharacter(world.id);
    const loc = await createTestLocation(world.id);

    const story = await callTool("save_story", {
      worldId: world.id,
      title: "MCP Story",
      content: "A tale told through tools",
      prompt: "Tell me a story",
      characterIds: [char.id],
      locationIds: [loc.id],
    });
    expect(story.title).toBe("MCP Story");

    const retrieved = await callTool("get_story", { worldId: world.id, storyId: story.id });
    expect(retrieved.storyCharacters).toHaveLength(1);
    expect(retrieved.storyLocations).toHaveLength(1);
  });
});

describe("lore tools", () => {
  it("saves and updates lore artifacts", async () => {
    const world = await createTestWorld();
    const story = await createTestStory(world.id);

    await callTool("save_lore_artifacts", {
      worldId: world.id,
      storyId: story.id,
      artifacts: [
        { content: "Lore one", characterId: null, locationId: null },
        { content: "Lore two", characterId: null, locationId: null },
      ],
    });

    const all = await callTool("list_lore", { worldId: world.id });
    expect(all).toHaveLength(2);

    await callTool("update_lore_status", { worldId: world.id, loreId: all[0].id, status: "kept" });
    const kept = await callTool("list_lore", { worldId: world.id, status: "kept" });
    expect(kept).toHaveLength(1);
  });
});

describe("context tools", () => {
  it("returns world context", async () => {
    const world = await createTestWorld();
    await createTestCharacter(world.id);
    await createTestLocation(world.id);

    const ctx = await callTool("get_world_context", { worldId: world.id });
    expect(ctx.world.name).toBe("Test World");
    expect(ctx.characters).toHaveLength(1);
    expect(ctx.locations).toHaveLength(1);
  });

  it("returns consistency check data", async () => {
    const world = await createTestWorld();
    const result = await callTool("check_consistency", { worldId: world.id });
    expect(result.instruction).toContain("inconsistencies");
  });

  it("returns connection suggestion data", async () => {
    const world = await createTestWorld();
    const result = await callTool("suggest_connections", { worldId: world.id });
    expect(result.instruction).toContain("connections");
  });
});
