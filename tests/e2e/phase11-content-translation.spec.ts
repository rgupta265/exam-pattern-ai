import { test, expect } from "@playwright/test";

test.describe("Phase 11: Complete Page Content Translation & Language Consistency Suite", () => {
  test.describe("Public Home Landing Page Dynamic Content Translation", () => {
    test("Landing page renders complete English content at /en", async ({ page }) => {
      await page.goto("/en");

      // Verify English Headline and Buttons
      await expect(page.getByRole("heading", { name: /Master Official Exams with/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Start Mock Practice/i }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: /Candidate Login/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Admin Console/i })).toBeVisible();

      // Verify Feature cards in English
      await expect(page.getByText("Verified Blueprints")).toBeVisible();
      await expect(page.getByText("AI Pattern Engine")).toBeVisible();
      await expect(page.getByText("Touch Exam Interface")).toBeVisible();
    });

    test("Switching to Hindi dynamically changes actual landing page visible content to Hindi", async ({ page }) => {
      await page.goto("/en");

      // Switch language to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi$/);

      // Verify Hindi Headline and Buttons
      await expect(page.getByRole("heading", { name: /आधिकारिक परीक्षाओं में सफलता पाएं/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /मॉक अभ्यास शुरू करें/i }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: /अभ्यर्थी लॉगिन/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /व्यवस्थापक कंसोल/i })).toBeVisible();

      // Verify Feature cards in Hindi
      await expect(page.getByText("सत्यापित ब्लूप्रिंट")).toBeVisible();
      await expect(page.getByText("एआई पैटर्न इंजन")).toBeVisible();
      await expect(page.getByText("टच परीक्षा इंटरफ़ेस")).toBeVisible();
    });
  });

  test.describe("Authentication Pages Dynamic Content Translation", () => {
    test("Login page renders complete English content at /en/login", async ({ page }) => {
      await page.goto("/en/login");

      await expect(page.getByRole("heading", { name: /Sign In to ExamPattern/i })).toBeVisible();
      await expect(page.getByLabel(/Email Address/i)).toBeVisible();
      await expect(page.getByLabel(/Password/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /Forgot password\?/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Sign In$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Create an account/i })).toBeVisible();
    });

    test("Login page dynamically changes all labels, placeholders, and buttons when switched to /hi/login", async ({ page }) => {
      await page.goto("/en/login");

      // Switch language to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/login$/);

      await expect(page.getByRole("heading", { name: /ExamPattern में साइन इन करें/i })).toBeVisible();
      await expect(page.getByLabel(/ईमेल पता/i)).toBeVisible();
      await expect(page.getByLabel(/पासवर्ड/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /पासवर्ड भूल गए\?/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /साइन इन करें/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /खाता बनाएं/i })).toBeVisible();
    });

    test("Register page renders in English and switches dynamically to Hindi", async ({ page }) => {
      await page.goto("/en/register");

      await expect(page.getByRole("heading", { name: /Create Candidate Account/i })).toBeVisible();
      await expect(page.getByLabel(/Full Name/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /Create Account/i })).toBeVisible();

      // Switch language to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/register$/);

      await expect(page.getByRole("heading", { name: /अभ्यर्थी खाता बनाएं/i })).toBeVisible();
      await expect(page.getByLabel(/पूरा नाम/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /पंजीकरण करें/i })).toBeVisible();
    });

    test("Forgot password page translates dynamically", async ({ page }) => {
      await page.goto("/en/forgot-password");

      await expect(page.getByRole("heading", { name: /Reset Password/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Send Reset Link/i })).toBeVisible();

      // Switch language to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/forgot-password$/);

      await expect(page.getByRole("heading", { name: /पासवर्ड रीसेट करें/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /रीसेट लिंक भेजें/i })).toBeVisible();
    });
  });

  test.describe("Error Pages Dynamic Translation", () => {
    test("403 Forbidden page renders in English and translates to Hindi", async ({ page }) => {
      await page.goto("/en/forbidden");

      await expect(page.getByRole("heading", { name: /403 — Access Denied/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Go to Candidate Dashboard/i })).toBeVisible();

      // Switch to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/forbidden$/);

      await expect(page.getByRole("heading", { name: /403 — अनुमति अस्वीकृत/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /अभ्यर्थी डैशबोर्ड पर जाएं/i })).toBeVisible();
    });

    test("404 Not Found page renders in English and translates to Hindi", async ({ page }) => {
      await page.goto("/en/sample-missing-page-404");

      await expect(page.getByRole("heading", { name: /Page Not Found/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Return to Home/i })).toBeVisible();

      // Switch to Hindi
      await page.getByRole("button", { name: /हिंदी/i }).click();
      await expect(page).toHaveURL(/\/hi\/sample-missing-page-404$/);

      await expect(page.getByRole("heading", { name: /पृष्ठ नहीं मिला/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /मुख्य पृष्ठ पर वापस जाएं/i })).toBeVisible();
    });
  });

  test.describe("Responsive Devanagari Typography & Overflow Audit", () => {
    const viewports = [
      { name: "360x640 Small Mobile", width: 360, height: 640 },
      { name: "390x844 iPhone 12/13/14", width: 390, height: 844 },
      { name: "412x915 Modern Android", width: 412, height: 915 },
      { name: "768x1024 Tablet Portrait", width: 768, height: 1024 },
      { name: "1440x900 Standard Desktop", width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      test(`Hindi page content layout has zero horizontal overflow on ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/hi");

        // Verify headline rendered
        await expect(page.getByRole("heading", { name: /आधिकारिक परीक्षाओं में सफलता पाएं/i })).toBeVisible();

        // Verify zero horizontal scroll overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
