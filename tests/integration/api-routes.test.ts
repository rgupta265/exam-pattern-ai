import { describe, it, expect } from "vitest";
import { successResponse, errorResponse } from "@/lib/response";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";

describe("API Response Envelopes and Error Handling", () => {
  it("should generate standardized success JSON response", async () => {
    const res = successResponse({ examId: "exam-123", name: "UP Health Officer" }, 201);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.examId).toBe("exam-123");
    expect(json.data.name).toBe("UP Health Officer");
    expect(json.error).toBeUndefined();
  });

  it("should properly format UnauthorizedError into 401 envelope", async () => {
    const res = errorResponse(new UnauthorizedError("Session expired"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Session expired");
  });

  it("should properly format ForbiddenError into 403 envelope", async () => {
    const res = errorResponse(new ForbiddenError("Requires BLUEPRINT_LOCK permission"));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("should properly format NotFoundError into 404 envelope", async () => {
    const res = errorResponse(new NotFoundError("Exam Blueprint"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toContain("Exam Blueprint not found");
  });

  it("should properly format ValidationError into 400 envelope", async () => {
    const res = errorResponse(new ValidationError("Invalid question schema", { field: "options" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details).toEqual({ field: "options" });
  });
});
