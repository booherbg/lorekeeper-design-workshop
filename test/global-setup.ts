import { execSync } from "node:child_process";

export default function setup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.includes("test.db")) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL must contain "test.db" but got "${dbUrl}"`
    );
  }
  execSync("npx prisma migrate reset --force", {
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
    },
    stdio: "inherit",
  });
}
