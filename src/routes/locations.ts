import { FastifyInstance } from "fastify";
import { getWorldById } from "../services/world-service";
import {
  createLocation,
  listLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} from "../services/location-service";

export async function locationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    const { worldId } = request.params as { worldId: string };
    const world = await getWorldById(Number(worldId));
    if (!world) {
      return reply.status(404).send("World not found");
    }
    (request as any).world = world;
  });

  app.get("/worlds/:worldId/locations", async (request, reply) => {
    const world = (request as any).world;
    const locations = await listLocations(world.id);
    return reply.view("locations/list.hbs", {
      world,
      locations,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Locations" },
      ],
    });
  });

  app.get("/worlds/:worldId/locations/new", async (request, reply) => {
    const world = (request as any).world;
    return reply.view("locations/form.hbs", {
      world,
      location: null,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Locations", href: `/worlds/${world.id}/locations` },
        { label: "New Location" },
      ],
    });
  });

  app.post("/worlds/:worldId/locations", async (request, reply) => {
    const world = (request as any).world;
    const { name, description } = request.body as { name: string; description: string };
    const location = await createLocation(world.id, { name, description });
    return reply.redirect(`/worlds/${world.id}/locations/${location.id}`);
  });

  app.get("/worlds/:worldId/locations/:id", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const location = await getLocationById(world.id, Number(id));
    if (!location) {
      return reply.status(404).send("Location not found");
    }
    return reply.view("locations/detail.hbs", {
      world,
      location,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Locations", href: `/worlds/${world.id}/locations` },
        { label: location.name },
      ],
    });
  });

  app.get("/worlds/:worldId/locations/:id/edit", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const location = await getLocationById(world.id, Number(id));
    if (!location) {
      return reply.status(404).send("Location not found");
    }
    return reply.view("locations/form.hbs", {
      world,
      location,
      crumbs: [
        { label: "Worlds", href: "/worlds" },
        { label: world.name, href: `/worlds/${world.id}` },
        { label: "Locations", href: `/worlds/${world.id}/locations` },
        { label: location.name, href: `/worlds/${world.id}/locations/${location.id}` },
        { label: "Edit" },
      ],
    });
  });

  app.post("/worlds/:worldId/locations/:id/update", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    const { name, description } = request.body as { name: string; description: string };
    await updateLocation(world.id, Number(id), { name, description });
    return reply.redirect(`/worlds/${world.id}/locations/${Number(id)}`);
  });

  app.post("/worlds/:worldId/locations/:id/delete", async (request, reply) => {
    const world = (request as any).world;
    const { id } = request.params as { id: string };
    await deleteLocation(world.id, Number(id));
    return reply.redirect(`/worlds/${world.id}/locations`);
  });
}
