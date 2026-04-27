import { prisma } from "../db";

interface CreateWorldInput {
  name: string;
  description?: string | null;
}

interface UpdateWorldInput {
  name?: string;
  description?: string | null;
}

function validateName(name: unknown): string {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Name is required");
  }
  const trimmed = name.trim();
  if (trimmed.length > 255) {
    throw new Error("Name must be 255 characters or fewer");
  }
  return trimmed;
}

export async function createWorld(data: CreateWorldInput) {
  const name = validateName(data.name);
  return prisma.world.create({
    data: {
      name,
      description: data.description ?? null,
    },
  });
}

export async function listWorlds() {
  return prisma.world.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorldById(id: number) {
  return prisma.world.findUnique({ where: { id } });
}

export async function getWorldWithCounts(id: number) {
  const world = await prisma.world.findUnique({
    where: { id },
    include: {
      _count: {
        select: { characters: true },
      },
    },
  });
  if (!world) return null;
  return {
    ...world,
    characterCount: world._count.characters,
    locationCount: 0,
    storyCount: 0,
    loreCount: 0,
  };
}

export async function updateWorld(id: number, data: UpdateWorldInput) {
  const existing = await prisma.world.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("World not found");
  }

  const updateData: { name?: string; description?: string | null } = {};
  if (data.name !== undefined) {
    updateData.name = validateName(data.name);
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  return prisma.world.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteWorld(id: number) {
  const existing = await prisma.world.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("World not found");
  }
  return prisma.world.delete({ where: { id } });
}
