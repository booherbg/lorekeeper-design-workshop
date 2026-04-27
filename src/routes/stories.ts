import { FastifyInstance } from "fastify";
import { getWorldById } from "../services/world-service";
import {
  listStories,
  getStoryById,
  deleteStory,
} from "../services/story-service";
import { prisma } from "../db";

export async function storyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    const { worldId } = request.params as { worldId: string };
    const world = await getWorldById(Number(worldId));
    if (!world) {
      return reply.status(404).send("World not found");
    }
    (request as any).world = world;
  });

  app.get("/worlds/:worldId/stories", async (request, reply) => {
    const world = (request as any).world;
    const stories = await listStories(world.id);
    const counts = await prisma.world.findUnique({
      where: { id: world.id },
      include: { _count: { select: { characters: true, locations: true } } },
    });
    const hasCharactersOrLocations =
      (counts?._count.characters ?? 0) > 0 || (counts?._count.locations ?? 0) > 0;
    return reply.view("stories/list.hbs", {
      world,
      stories,
      hasCharactersOrLocations,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Stories" },
      ],
    });
  });

  app.get("/worlds/:worldId/stories/:id", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const story = await getStoryById(world.id, Number(id));
    if (!story) {
      return reply.status(404).send("Story not found");
    }
    const loreArtifacts = await prisma.loreArtifact.findMany({
      where: { storyId: story.id },
      include: {
        character: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return reply.view("stories/detail.hbs", {
      world,
      story,
      characters: story.storyCharacters.map((sc) => sc.character),
      locations: story.storyLocations.map((sl) => sl.location),
      loreArtifacts,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Stories", href: `/worlds/${world.id}/stories` },
        { label: story.title },
      ],
    });
  });

  app.post("/worlds/:worldId/stories/:id/delete", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    await deleteStory(world.id, Number(id));
    return reply.redirect(`/worlds/${world.id}/stories`);
  });
}
