import { prisma } from "../db";

interface CreateLocationInput {
  name: string;
  description: string;
}

interface UpdateLocationInput {
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

export async function createLocation(worldId: number, data: CreateLocationInput) {
  await ensureWorldExists(worldId);
  const name = validateName(data.name);
  const description = validateDescription(data.description);
  return prisma.location.create({
    data: { worldId, name, description },
  });
}

export async function listLocations(worldId: number) {
  return prisma.location.findMany({
    where: { worldId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLocationById(worldId: number, id: number) {
  return prisma.location.findFirst({
    where: { id, worldId },
  });
}

export async function updateLocation(worldId: number, id: number, data: UpdateLocationInput) {
  const existing = await prisma.location.findFirst({ where: { id, worldId } });
  if (!existing) {
    throw new Error("Location not found");
  }

  const updateData: { name?: string; description?: string } = {};
  if (data.name !== undefined) {
    updateData.name = validateName(data.name);
  }
  if (data.description !== undefined) {
    updateData.description = validateDescription(data.description);
  }

  return prisma.location.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteLocation(worldId: number, id: number) {
  const existing = await prisma.location.findFirst({ where: { id, worldId } });
  if (!existing) {
    throw new Error("Location not found");
  }
  return prisma.location.delete({ where: { id } });
}
