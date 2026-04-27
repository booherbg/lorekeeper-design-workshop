import { buildApp } from "./app";

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  const app = await buildApp();
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Lorekeeper running at http://localhost:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
