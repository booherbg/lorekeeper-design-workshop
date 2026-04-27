import { prisma } from "../db";

const VALID_STATUSES = ["pending", "kept", "discarded"] as const;
type LoreStatus = (typeof VALID_STATUSES)[number];

interface CreateLoreInput {
  storyId: number;
  content: string;
  characterId: number | null;
  locationId: number | null;
}

interface ListLoreFilters {
  status?: LoreStatus;
}

async function ensureWorldExists(worldId: number) {
  const world = await prisma.world.findUnique({ where: { id: worldId } });
  if (!world) {
    throw new Error("World not found");
  }
  return world;
}

export async function createLoreArtifact(worldId: number, data: CreateLoreInput) {
  await ensureWorldExists(worldId);

  const story = await prisma.story.findFirst({
    where: { id: data.storyId, worldId },
  });
  if (!story) {
    throw new Error("Story not found");
  }

  if (typeof data.content !== "string" || data.content.trim().length === 0) {
    throw new Error("Content is required");
  }

  return prisma.loreArtifact.create({
    data: {
      worldId,
      storyId: data.storyId,
      content: data.content.trim(),
      characterId: data.characterId,
      locationId: data.locationId,
      status: "pending",
    },
  });
}

export async function createLoreArtifacts(worldId: number, items: CreateLoreInput[]) {
  if (items.length === 0) return [];

  const results = [];
  for (const item of items) {
    results.push(await createLoreArtifact(worldId, item));
  }
  return results;
}

export async function listLoreArtifacts(worldId: number, filters: ListLoreFilters = {}) {
  const where: { worldId: number; status?: string } = { worldId };
  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.loreArtifact.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      story: { select: { id: true, title: true } },
      character: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
    },
  });
}

export async function updateLoreStatus(worldId: number, id: number, status: LoreStatus) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Status must be one of: pending, kept, discarded");
  }

  const existing = await prisma.loreArtifact.findFirst({
    where: { id, worldId },
  });
  if (!existing) {
    throw new Error("Lore artifact not found");
  }

  return prisma.loreArtifact.update({
    where: { id },
    data: { status },
  });
}
