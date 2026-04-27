import { FastifyInstance } from "fastify";
import { getWorldById } from "../services/world-service";
import {
  createCharacter,
  listCharacters,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
} from "../services/character-service";

export async function characterRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    const { worldId } = request.params as { worldId: string };
    const world = await getWorldById(Number(worldId));
    if (!world) {
      return reply.status(404).send("World not found");
    }
    (request as any).world = world;
  });

  app.get("/worlds/:worldId/characters", async (request, reply) => {
    const world = (request as any).world;
    const characters = await listCharacters(world.id);
    return reply.view("characters/list.hbs", {
      world,
      characters,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Characters" },
      ],
    });
  });

  app.get("/worlds/:worldId/characters/new", async (request, reply) => {
    const world = (request as any).world;
    return reply.view("characters/form.hbs", {
      world,
      character: null,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Characters", href: `/worlds/${world.id}/characters` },
        { label: "New Character" },
      ],
    });
  });

  app.post("/worlds/:worldId/characters", async (request, reply) => {
    const world = (request as any).world;
    const { name, description } = request.body as { name: string; description: string };
    const character = await createCharacter(world.id, { name, description });
    return reply.redirect(`/worlds/${world.id}/characters/${character.id}`);
  });

  app.get("/worlds/:worldId/characters/:id", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const character = await getCharacterById(world.id, Number(id));
    if (!character) {
      return reply.status(404).send("Character not found");
    }
    return reply.view("characters/detail.hbs", {
      world,
      character,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Characters", href: `/worlds/${world.id}/characters` },
        { label: character.name },
      ],
    });
  });

  app.get("/worlds/:worldId/characters/:id/edit", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const character = await getCharacterById(world.id, Number(id));
    if (!character) {
      return reply.status(404).send("Character not found");
    }
    return reply.view("characters/form.hbs", {
      world,
      character,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Characters", href: `/worlds/${world.id}/characters` },
        { label: character.name, href: `/worlds/${world.id}/characters/${character.id}` },
        { label: "Edit" },
      ],
    });
  });

  app.post("/worlds/:worldId/characters/:id/update", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const { name, description } = request.body as { name: string; description: string };
    await updateCharacter(world.id, Number(id), { name, description });
    return reply.redirect(`/worlds/${world.id}/characters/${Number(id)}`);
  });

  app.post("/worlds/:worldId/characters/:id/delete", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    await deleteCharacter(world.id, Number(id));
    return reply.redirect(`/worlds/${world.id}/characters`);
  });
}
