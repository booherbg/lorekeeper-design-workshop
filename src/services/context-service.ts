import { prisma } from "../db";

export async function getWorldContext(worldId: number) {
  const world = await prisma.world.findUnique({
    where: { id: worldId },
    select: { id: true, name: true, description: true },
  });
  if (!world) {
    throw new Error("World not found");
  }

  const characters = await prisma.character.findMany({
    where: { worldId },
    select: { id: true, name: true, description: true },
  });

  const locations = await prisma.location.findMany({
    where: { worldId },
    select: { id: true, name: true, description: true },
  });

  const lore = await prisma.loreArtifact.findMany({
    where: { worldId, status: "kept" },
    select: { id: true, content: true, characterId: true, locationId: true },
  });

  const stories = await prisma.story.findMany({
    where: { worldId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 5,
    select: { id: true, title: true, content: true },
  });

  const recentStories = stories.map((s) => ({
    id: s.id,
    title: s.title,
    contentPreview: s.content.slice(0, 200),
  }));

  return { world, characters, locations, lore, recentStories };
}
