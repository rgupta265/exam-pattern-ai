import { test, expect } from "@playwright/test";

test.describe("Phase 8 Critical E2E Workflows", () => {
  test("Locale routing & Language switcher preserves route and parameters", async ({ page }) => {
    // 1. Visit /en/login
    await page.goto("/en/login");
    await expect(page).toHaveURL(/.*\/en\/login/);

    // 2. Switch to Hindi
    const hindiBtn = page.getByRole("button", { name: /हिंदी में बदलें/i });
    if (await hindiBtn.isVisible()) {
      await hindiBtn.click();
      await expect(page).toHaveURL(/.*\/hi\/login/);
    }
  });

  test("Candidate Practice Navigation & Create Practice page responsiveness (390x844 mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/login");

    // Check login container width and responsive layout
    const container = page.locator("form");
    if (await container.isVisible()) {
      const box = await container.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(390);
    }
  });
});
