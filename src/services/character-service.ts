import { prisma } from "../db";

interface CreateCharacterInput {
  name: string;
  description: string;
}

interface UpdateCharacterInput {
  name?: string;
  description?: string;
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

function validateDescription(description: unknown): string {
  if (typeof description !== "string" || description.trim().length === 0) {
    throw new Error("Description is required");
  }
  return description.trim();
}

async function ensureWorldExists(worldId: number) {
  const world = await prisma.world.findUnique({ where: { id: worldId } });
  if (!world) {
    throw new Error("World not found");
  }
  return world;
}

export async function createCharacter(worldId: number, data: CreateCharacterInput) {
  await ensureWorldExists(worldId);
  const name = validateName(data.name);
  const description = validateDescription(data.description);
  return prisma.character.create({
    data: { worldId, name, description },
  });
}

export async function listCharacters(worldId: number) {
  return prisma.character.findMany({
    where: { worldId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCharacterById(worldId: number, id: number) {
  return prisma.character.findFirst({
    where: { id, worldId },
  });
}

export async function updateCharacter(worldId: number, id: number, data: UpdateCharacterInput) {
  const existing = await prisma.character.findFirst({ where: { id, worldId } });
  if (!existing) {
    throw new Error("Character not found");
  }

  const updateData: { name?: string; description?: string } = {};
  if (data.name !== undefined) {
    updateData.name = validateName(data.name);
  }
  if (data.description !== undefined) {
    updateData.description = validateDescription(data.description);
  }

  return prisma.character.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCharacter(worldId: number, id: number) {
  const existing = await prisma.character.findFirst({ where: { id, worldId } });
  if (!existing) {
    throw new Error("Character not found");
  }
  return prisma.character.delete({ where: { id } });
}
