import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Port 3000 is routinely occupied by the bcm-v2-docker frontend
    // container during local dev — use 3001 so this never collides with it
    // or silently tests that stale build instead of the current source.
    //
    // --webpack: Turbopack (Next.js 16's default dev bundler) hangs forever
    // compiling /dashboard in this project — reproduced directly (curl
    // against a manually-started `next dev` never returned, log stuck on
    // "Compiling /dashboard ..." with no CPU/memory movement past ~70s).
    // Webpack compiles the same route in ~8s. Revisit removing this once
    // upstream Turbopack fixes whatever it's tripping on here.
    command: "npx next dev -p 3001 --webpack",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
