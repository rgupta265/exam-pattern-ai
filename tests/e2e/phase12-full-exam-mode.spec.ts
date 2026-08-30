import { test, expect } from "@playwright/test";

test.describe("Phase 12: Full Examination Mode, Retake Support & Global Loader Suite", () => {
  test.describe("Candidate Mock Tests Page & Mode Switcher", () => {
    test("Renders Full Examination Mode and allows switching between Full Exam and Topic Drill", async ({ page }) => {
      await page.goto("/en/candidate/mock-tests");

      // Verify page title and badge
      await expect(page.getByRole("heading", { name: /Mock Tests/i })).toBeVisible();

      // Verify Full Examination mode button
      const fullExamBtn = page.getByRole("button", { name: /Full Examination/i });
      const topicDrillBtn = page.getByRole("button", { name: /Topic Practice Drill/i });

      await expect(fullExamBtn).toBeVisible();
      await expect(topicDrillBtn).toBeVisible();

      // Switch to Topic Practice Drill
      await topicDrillBtn.click();
      await expect(page.getByText(/Verified Syllabus Topic/i)).toBeVisible();

      // Switch back to Full Examination
      await fullExamBtn.click();
      await expect(page.getByText(/Target Exam/i)).toBeVisible();
    });

    test("Hindi version of candidate mock tests renders authentic localized UI", async ({ page }) => {
      await page.goto("/hi/candidate/mock-tests");

      await expect(page.getByRole("heading", { name: /मॉक टेस्ट/i })).toBeVisible();
    });
  });

  test.describe("Mobile Responsive Full Examination Audit", () => {
    const viewports = [
      { name: "360x640 Small Mobile", width: 360, height: 640 },
      { name: "390x844 iPhone 12/13/14", width: 390, height: 844 },
      { name: "412x915 Modern Android", width: 412, height: 915 },
    ];

    for (const vp of viewports) {
      test(`Mock tests list has zero horizontal overflow on ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/en/candidate/mock-tests");

        // Verify zero horizontal scroll overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
