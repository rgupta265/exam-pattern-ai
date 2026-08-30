import { test, expect } from "@playwright/test";

const viewports = [
  { name: "Small Mobile (360x640)", width: 360, height: 640 },
  { name: "Standard Mobile (390x844)", width: 390, height: 844 },
  { name: "Modern Android (412x915)", width: 412, height: 915 },
  { name: "Tablet Portrait (768x1024)", width: 768, height: 1024 },
  { name: "Tablet Landscape (1024x1366)", width: 1024, height: 1366 },
  { name: "Desktop Standard (1440x900)", width: 1440, height: 900 },
];

for (const vp of viewports) {
  test.describe(`Multi-Viewport Responsive Audit: ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`should render /en/login with zero horizontal overflow on ${vp.name}`, async ({ page }) => {
      await page.goto("/en/login");
      await expect(page.locator("h1, h2")).toBeVisible();

      // Ensure no horizontal scrollbar on body
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });

    test(`should render /hi/login in Hindi with zero horizontal overflow on ${vp.name}`, async ({ page }) => {
      await page.goto("/hi/login");
      await expect(page.locator("h1, h2")).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });

    test(`should render /en/register cleanly on ${vp.name}`, async ({ page }) => {
      await page.goto("/en/register");
      await expect(page.locator("h1, h2")).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });
}
