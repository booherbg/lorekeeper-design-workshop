import { FastifyInstance } from "fastify";
import { getWorldById } from "../services/world-service";
import {
  listStories,
  getStoryById,
  deleteStory,
} from "../services/story-service";

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
    return reply.view("stories/list.hbs", {
      world,
      stories,
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
    return reply.view("stories/detail.hbs", {
      world,
      story,
      characters: story.storyCharacters.map((sc) => sc.character),
      locations: story.storyLocations.map((sl) => sl.location),
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
