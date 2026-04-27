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
import { prisma } from "./db";
import fs from "node:fs";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./mcp-tools";

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

  app.get("/setup", async (_request, reply) => {
    const projectPath = path.resolve(__dirname, "..");
    const skillPath = path.join(projectPath, "skills", "lorekeeper-advisor", "SKILL.md");
    let skillContent = "";
    try { skillContent = fs.readFileSync(skillPath, "utf-8"); } catch {}
    return reply.view("setup.hbs", {
      projectPath,
      skillContent,
      crumbs: [{ label: "Setup" }],
    });
  });

  app.get("/setup/skill-file", async (_request, reply) => {
    const skillPath = path.join(path.resolve(__dirname, ".."), "skills", "lorekeeper-advisor", "SKILL.md");
    const content = fs.readFileSync(skillPath, "utf-8");
    return reply.type("text/plain").send(content);
  });

  app.get("/setup/cursor-skill-file", async (_request, reply) => {
    const skillPath = path.join(path.resolve(__dirname, ".."), "skills", "lorekeeper-advisor", "SKILL.md");
    const content = fs.readFileSync(skillPath, "utf-8");
    return reply.type("text/plain").send(content);
  });

  app.get("/setup/install", async (_request, reply) => {
    const scriptPath = path.join(path.resolve(__dirname, ".."), "scripts", "install.sh");
    const content = fs.readFileSync(scriptPath, "utf-8");
    return reply.type("text/plain").send(content);
  });

  app.get("/lorekeeper", async (_request, reply) => {
    const worldsRaw = await prisma.world.findMany({
      include: {
        _count: { select: { characters: true, locations: true, stories: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const worlds = worldsRaw.map((w) => {
      const d = new Date(w.createdAt);
      const day = d.getDate();
      const suffix =
        day % 10 === 1 && day !== 11 ? "st" :
        day % 10 === 2 && day !== 12 ? "nd" :
        day % 10 === 3 && day !== 13 ? "rd" : "th";
      const month = d.toLocaleDateString("en-US", { month: "long" });
      const inscribedDate = `the ${day}${suffix} of ${month}`;
      return {
        name: w.name,
        inscribedDate,
        characterCount: w._count.characters,
        locationCount: w._count.locations,
        storyCount: w._count.stories,
      };
    });

    let sessionCount = 0;
    const summaryDir = path.join(__dirname, "../docs/PROMPTS/SESSION-SUMMARIES");
    try {
      const files = fs.readdirSync(summaryDir);
      sessionCount = files.filter((f) => f.endsWith(".md")).length;
    } catch {}

    const templatePath = path.join(__dirname, "views", "lorekeeper.hbs");
    const template = Handlebars.compile(fs.readFileSync(templatePath, "utf-8"));
    const html = template({ worlds, sessionCount: sessionCount > 0 ? sessionCount : null });
    return reply.type("text/html").send(html);
  });

  // MCP over HTTP — stateless StreamableHTTP transport
  const mcpHandler = async (request: any, reply: any) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
    reply.hijack();
  };

  app.post("/mcp", mcpHandler);
  app.get("/mcp", mcpHandler);
  app.delete("/mcp", mcpHandler);

  await app.register(worldRoutes);
  await app.register(characterRoutes);
  await app.register(locationRoutes);
  await app.register(storyRoutes);
  await app.register(loreRoutes);

  return app;
}
