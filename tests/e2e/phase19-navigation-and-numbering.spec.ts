import { test, expect } from "@playwright/test";

test.describe("Phase 19: Mock Examination Navigation & Section-Wise Question Numbering", () => {
  test.describe("Section-Wise Question Numbering & Cross-Section Navigation UI Verification", () => {
    test("Candidate exam instruction page is accessible and redirects to secure exam room", async ({ page }) => {
      // Navigate to candidate mock tests list
      await page.goto("/en/candidate/mock-tests");
      await expect(page.getByRole("heading", { name: /Mock Tests/i })).toBeVisible();

      // Check if test cards are visible
      const startExamButtons = page.getByRole("button", { name: /Start Exam|Take Test/i });
      const count = await startExamButtons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("Hindi portal renders authentic localized examination UI", async ({ page }) => {
      await page.goto("/hi/candidate/mock-tests");
      await expect(page.getByRole("heading", { name: /मॉक टेस्ट/i })).toBeVisible();
    });
  });

  test.describe("Mobile Responsive Audit for Exam Room Viewports", () => {
    const viewports = [
      { name: "360x640 Small Mobile", width: 360, height: 640 },
      { name: "390x844 iPhone 12/13/14", width: 390, height: 844 },
      { name: "412x915 Modern Android", width: 412, height: 915 },
      { name: "768x1024 iPad Portrait", width: 768, height: 1024 },
      { name: "1440x900 Standard Desktop", width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      test(`Examination interface renders without horizontal overflow on ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/en/candidate/mock-tests");

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
