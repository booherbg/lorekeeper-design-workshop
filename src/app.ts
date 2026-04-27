import Fastify from "fastify";
import view from "@fastify/view";
import formbody from "@fastify/formbody";
import Handlebars from "handlebars";
import path from "node:path";
import { worldRoutes } from "./routes/worlds";

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

  app.get("/", async (_request, reply) => {
    return reply.redirect("/worlds");
  });

  await app.register(worldRoutes);

  return app;
}
