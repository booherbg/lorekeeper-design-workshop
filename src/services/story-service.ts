import { prisma } from "../db";

interface CreateStoryInput {
  title: string;
  content: string;
  prompt: string;
  characterIds: number[];
  locationIds: number[];
}

function validateRequired(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

async function ensureWorldExists(worldId: number) {
  const world = await prisma.world.findUnique({ where: { id: worldId } });
  if (!world) {
    throw new Error("World not found");
  }
  return world;
}

export async function createStory(worldId: number, data: CreateStoryInput) {
  await ensureWorldExists(worldId);
  const title = validateRequired(data.title, "Title");
  const content = validateRequired(data.content, "Content");
  const prompt = validateRequired(data.prompt, "Prompt");

  if (data.characterIds.length > 0) {
    const chars = await prisma.character.findMany({
      where: { id: { in: data.characterIds }, worldId },
    });
    if (chars.length !== data.characterIds.length) {
      throw new Error("Character IDs must belong to this world");
    }
  }

  if (data.locationIds.length > 0) {
    const locs = await prisma.location.findMany({
      where: { id: { in: data.locationIds }, worldId },
    });
    if (locs.length !== data.locationIds.length) {
      throw new Error("Location IDs must belong to this world");
    }
  }

  return prisma.story.create({
    data: {
      worldId,
      title,
      content,
      prompt,
      storyCharacters: {
        create: data.characterIds.map((characterId) => ({ characterId })),
      },
      storyLocations: {
        create: data.locationIds.map((locationId) => ({ locationId })),
      },
    },
    include: {
      storyCharacters: true,
      storyLocations: true,
    },
  });
}

export async function listStories(worldId: number) {
  return prisma.story.findMany({
    where: { worldId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      storyCharacters: {
        include: { character: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getStoryById(worldId: number, id: number) {
  return prisma.story.findFirst({
    where: { id, worldId },
    include: {
      storyCharacters: {
        include: { character: { select: { id: true, name: true } } },
      },
      storyLocations: {
        include: { location: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function deleteStory(worldId: number, id: number) {
  const existing = await prisma.story.findFirst({ where: { id, worldId } });
  if (!existing) {
    throw new Error("Story not found");
  }
  return prisma.story.delete({ where: { id } });
}
