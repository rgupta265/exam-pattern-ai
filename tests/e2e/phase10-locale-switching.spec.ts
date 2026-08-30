import { test, expect } from "@playwright/test";

test.describe("Phase 10: Complete Locale Routing & Language Switcher Suite", () => {
  test.describe("Part 1 & 3: Canonical URLs & Root Redirection", () => {
    test("Root URL '/' must redirect/resolve to canonical '/en'", async ({ page }) => {
      // Clear cookies to simulate fresh visit
      await page.context().clearCookies();
      await page.goto("/");
      await expect(page).toHaveURL(/\/en$/);
    });

    test("Locale-less '/login' must redirect to '/en/login'", async ({ page }) => {
      await page.context().clearCookies();
      await page.goto("/login");
      await expect(page).toHaveURL(/\/en\/login$/);
    });

    test("Locale-less '/register' must redirect to '/en/register'", async ({ page }) => {
      await page.context().clearCookies();
      await page.goto("/register");
      await expect(page).toHaveURL(/\/en\/register$/);
    });

    test("Direct visit to '/hi' must render in Hindi canonical prefix without redirect loop", async ({ page }) => {
      await page.goto("/hi");
      await expect(page).toHaveURL(/\/hi$/);
    });
  });

  test.describe("Part 5 & 6: Language Switcher on Public & Auth Pages", () => {
    test("Public home page has language switcher and toggles EN <-> HI", async ({ page }) => {
      await page.goto("/en");

      // Verify language switcher group exists
      const langSwitcher = page.locator('[role="group"][aria-label*="Select language"]');
      await expect(langSwitcher).toBeVisible();

      // Click Hindi button
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi$/);

      // Switch back to English
      await page.getByRole("button", { name: /English/i }).click();
      await expect(page).toHaveURL(/\/en$/);
    });

    test("Login page has language switcher without requiring authentication", async ({ page }) => {
      await page.goto("/en/login");

      const langSwitcher = page.locator('[role="group"][aria-label*="Select language"]');
      await expect(langSwitcher).toBeVisible();

      // Switch to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/login$/);

      // Verify create account link is localized to Hindi
      const createAccountLink = page.getByRole("link", { name: /Create an account/i });
      await expect(createAccountLink).toHaveAttribute("href", "/hi/register");
    });

    test("Register page has language switcher and localized links", async ({ page }) => {
      await page.goto("/en/register");

      const langSwitcher = page.locator('[role="group"][aria-label*="Select language"]');
      await expect(langSwitcher).toBeVisible();

      // Switch to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/register$/);

      // Verify sign in link is localized to Hindi
      const signInLink = page.getByRole("link", { name: /Sign in/i });
      await expect(signInLink).toHaveAttribute("href", "/hi/login");
    });

    test("Forgot password page has language switcher", async ({ page }) => {
      await page.goto("/en/forgot-password");

      const langSwitcher = page.locator('[role="group"][aria-label*="Select language"]');
      await expect(langSwitcher).toBeVisible();

      // Switch to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/forgot-password$/);
    });
  });

  test.describe("Part 6 & 8: Dynamic Route & Query Parameter Preservation", () => {
    test("Preserves query parameters on language switch", async ({ page }) => {
      await page.goto("/en/login?callbackUrl=%2Fcandidate%2Fmock-tests&ref=header");

      // Switch to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();

      // Verify URL preserved both callbackUrl and ref query params
      await expect(page).toHaveURL(/\/hi\/login\?callbackUrl=%2Fcandidate%2Fmock-tests&ref=header/);
    });
  });

  test.describe("Part 13 & 23: Mobile-First Responsive Language Switcher Audit", () => {
    const mobileViewports = [
      { name: "360x640 Small Mobile", width: 360, height: 640 },
      { name: "390x844 iPhone 12/13/14", width: 390, height: 844 },
      { name: "412x915 Modern Android", width: 412, height: 915 },
    ];

    for (const vp of mobileViewports) {
      test(`Language switcher is touch-friendly and functional on ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/en/login");

        const langSwitcher = page.locator('[role="group"][aria-label*="Select language"]');
        await expect(langSwitcher).toBeVisible();

        // Tap Hindi button
        await page.getByRole("button", { name: /हिंदी/i }).click();
        await expect(page).toHaveURL(/\/hi\/login$/);

        // Verify zero horizontal scroll overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });

  test.describe("Part 9: Error & Not-Found Page Language Switcher", () => {
    test("404 page provides working language switcher", async ({ page }) => {
      await page.goto("/en/non-existent-sample-page-404");

      const langSwitcher = page.locator('[role="group"][aria-label*="Select language"]');
      await expect(langSwitcher).toBeVisible();

      // Switch to Hindi on 404
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/non-existent-sample-page-404$/);
    });
  });
});
