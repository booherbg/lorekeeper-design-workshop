import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./test/global-setup.ts",
    globalTeardown: "./test/global-teardown.ts",
    sequence: { concurrent: false },
    maxWorkers: 1,
    minWorkers: 1,
  },
});
