import { FastifyInstance } from "fastify";
import {
  createWorld,
  listWorldsWithCounts,
  getWorldById,
  getWorldWithCounts,
  updateWorld,
  deleteWorld,
} from "../services/world-service";

export async function worldRoutes(app: FastifyInstance) {
  app.get("/worlds", async (_request, reply) => {
    const worlds = await listWorldsWithCounts();
    return reply.view("worlds/list.hbs", { worlds });
  });

  app.get("/worlds/new", async (_request, reply) => {
    return reply.view("worlds/form.hbs", {
      world: null,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: "New World" },
      ],
    });
  });

  app.post("/worlds", async (request, reply) => {
    const { name, description } = request.body as {
      name: string;
      description?: string;
    };
    const world = await createWorld({ name, description: description || null });
    return reply.redirect(`/worlds/${world.id}`);
  });

  app.get("/worlds/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const world = await getWorldWithCounts(Number(id));
    if (!world) {
      return reply.status(404).send("World not found");
    }
    const showStoryCallout =
      (world.characterCount > 0 || world.locationCount > 0) && world.storyCount === 0;
    return reply.view("worlds/detail.hbs", {
      world,
      showStoryCallout,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name },
      ],
    });
  });

  app.get("/worlds/:id/edit", async (request, reply) => {
    const { id } = request.params as { id: string };
    const world = await getWorldById(Number(id));
    if (!world) {
      return reply.status(404).send("World not found");
    }
    return reply.view("worlds/form.hbs", {
      world,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Edit" },
      ],
    });
  });

  app.post("/worlds/:id/update", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, description } = request.body as {
      name: string;
      description?: string;
    };
    await updateWorld(Number(id), {
      name,
      description: description || null,
    });
    return reply.redirect(`/worlds/${Number(id)}`);
  });

  app.post("/worlds/:id/delete", async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteWorld(Number(id));
    return reply.redirect("/worlds");
  });
}
