# Testing Strategy — ExamPattern AI

## 1. Testing Frameworks
* **Unit & Integration:** Vitest (`vitest run`)
* **End-to-End (E2E):** Playwright (`playwright test`)

---

## 2. Test Coverage Suites

### Unit & Integration Suites (`tests/`):
* `tests/unit/rbac.test.ts` — Role & granular permission checks, strict guards.
* `tests/unit/auth.test.ts` — Bcrypt password hashing, JWT token signing/verification.
* `tests/unit/validation.test.ts` — Zod schema validation rules for all auth workflows.
* `tests/unit/storage.test.ts` — Storage service, path traversal defenses, size limits.
* `tests/integration/api-routes.test.ts` — API response envelopes, error code mapping.

### Multi-Device E2E Viewports (`e2e/`):
Target viewports configured in `playwright.config.ts`:
* Small Mobile: `360×640`
* iPhone 14: `390×844`
* Pixel 7: `412×915`
* iPad: `768×1024`
* Laptop HD: `1280×720`
* Desktop FHD: `1920×1080`
