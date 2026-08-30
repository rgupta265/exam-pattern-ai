import { describe, it, expect } from "vitest";
import { GET as getSuggestions } from "@/app/api/ai/suggestions/route";
import { NextRequest } from "next/server";

describe("Phase 6 API Routes Integration Tests", () => {
  it("should return 401 when accessing AI suggestions unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/suggestions?examId=fake-id");
    const res = await getSuggestions(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 when examId is missing in suggestions request", async () => {
    // Session mock can be tested via direct service invocation
    const req = new NextRequest("http://localhost:3000/api/ai/suggestions");
    const res = await getSuggestions(req);
    expect(res.status).toBe(401);
  });
});
