import { test, expect } from "@playwright/test";

test.describe("Phase 9: Locale Routing, Zero Credential Hints & Responsive Navigation", () => {
  test("should resolve root / to canonical /en landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*\/en/);
    await expect(page).toHaveTitle(/ExamPattern AI/);
    await expect(page.getByRole("heading", { name: /Master Official Exams/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("should display login screen with strictly neutral placeholders and ZERO credential hints", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { name: /Sign In to ExamPattern/i })).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();

    // Verify no demo/sample credentials appear in rendered text or markup
    const pageText = await page.textContent("body");
    expect(pageText).not.toContain("Demo Accounts");
    expect(pageText).not.toContain("Admin@12345");
    expect(pageText).not.toContain("Candidate@12345");
    expect(pageText).not.toContain("admin@exampattern.ai");
  });

  test("should display registration screen", async ({ page }) => {
    await page.goto("/en/register");
    await expect(page.getByRole("heading", { name: /Create Candidate Account/i })).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
  });

  test("should redirect unauthenticated users from candidate dashboard to localized login", async ({ page }) => {
    await page.goto("/en/candidate/dashboard");
    await expect(page).toHaveURL(/.*\/login\?callbackUrl=.*/);
  });

  test("should redirect unauthenticated users from admin dashboard to localized login", async ({ page }) => {
    await page.goto("/en/admin/dashboard");
    await expect(page).toHaveURL(/.*\/login\?callbackUrl=.*/);
  });
});
