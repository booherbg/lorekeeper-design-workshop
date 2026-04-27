import { FastifyInstance } from "fastify";
import { getWorldById } from "../services/world-service";
import { listLoreArtifacts, updateLoreStatus } from "../services/lore-service";

export async function loreRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    const { worldId } = request.params as { worldId: string };
    const world = await getWorldById(Number(worldId));
    if (!world) {
      return reply.status(404).send("World not found");
    }
    (request as any).world = world;
  });

  app.get("/worlds/:worldId/lore", async (request, reply) => {
    const world = (request as any).world;
    const { status } = request.query as { status?: string };
    const validStatus = ["pending", "kept", "discarded"].includes(status || "")
      ? (status as "pending" | "kept" | "discarded")
      : undefined;
    const lore = await listLoreArtifacts(world.id, validStatus ? { status: validStatus } : {});
    return reply.view("lore/list.hbs", {
      world,
      lore,
      currentFilter: validStatus || "all",
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Lore" },
      ],
    });
  });

  app.post("/worlds/:worldId/lore/:id/status", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    try {
      const updated = await updateLoreStatus(
        world.id,
        Number(id),
        status as "pending" | "kept" | "discarded"
      );
      return reply.send({ id: updated.id, status: updated.status });
    } catch (err: any) {
      if (err.message === "Lore artifact not found") {
        return reply.status(404).send({ error: err.message });
      }
      if (err.message.startsWith("Status must be")) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });
}
