import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-small",
      use: { viewport: { width: 360, height: 640 } },
    },
    {
      name: "mobile-iphone",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "mobile-android",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "tablet-ipad",
      use: { ...devices["iPad (gen 7)"] },
    },
    {
      name: "desktop-hd",
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: "desktop-fhd",
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
});
