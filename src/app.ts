import Fastify from "fastify";
import view from "@fastify/view";
import formbody from "@fastify/formbody";
import Handlebars from "handlebars";
import path from "node:path";
import { worldRoutes } from "./routes/worlds";
import { characterRoutes } from "./routes/characters";
import { locationRoutes } from "./routes/locations";
import { storyRoutes } from "./routes/stories";
import { loreRoutes } from "./routes/lore";

export async function buildApp() {
  const app = Fastify();

  await app.register(formbody);
  await app.register(view, {
    engine: { handlebars: Handlebars },
    root: path.join(__dirname, "views"),
    layout: "layouts/main.hbs",
    options: {
      partials: {
        breadcrumbs: "partials/breadcrumbs.hbs",
      },
    },
  });

  Handlebars.registerHelper("truncate", (str: string, len: number) => {
    if (!str) return "";
    if (str.length <= len) return str;
    return str.slice(0, len) + "...";
  });

  Handlebars.registerHelper("formatDate", (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  });

  Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

  app.get("/", async (_request, reply) => {
    return reply.redirect("/worlds");
  });

  await app.register(worldRoutes);
  await app.register(characterRoutes);
  await app.register(locationRoutes);
  await app.register(storyRoutes);
  await app.register(loreRoutes);

  return app;
}
