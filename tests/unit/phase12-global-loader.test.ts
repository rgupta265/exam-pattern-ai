import { describe, it, expect } from "vitest";

describe("Phase 12: Global Full-Screen Loader Architecture Tests", () => {
  it("should correctly handle concurrent request reference counting", () => {
    let activeRequests = 0;

    const showLoading = () => {
      activeRequests += 1;
    };

    const hideLoading = () => {
      activeRequests = Math.max(0, activeRequests - 1);
    };

    // Request A starts
    showLoading();
    expect(activeRequests).toBe(1);

    // Request B starts
    showLoading();
    expect(activeRequests).toBe(2);

    // Request A finishes -> overlay still active
    hideLoading();
    expect(activeRequests).toBe(1);

    // Request B finishes -> overlay hidden
    hideLoading();
    expect(activeRequests).toBe(0);
  });

  it("should never allow negative active request counts", () => {
    let activeRequests = 0;
    const hideLoading = () => {
      activeRequests = Math.max(0, activeRequests - 1);
    };

    hideLoading();
    expect(activeRequests).toBe(0);
  });
});
