import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["test/setup/globalSetup.ts"],
    setupFiles: ["test/setup/env.ts"],
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
