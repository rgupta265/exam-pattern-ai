import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as readinessGet } from "@/app/api/documents/readiness/[versionId]/route";
import { POST as urlExtractPost } from "@/app/api/url-extract/route";
import { POST as practiceResourcePost } from "@/app/api/candidate/practice/resources/route";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { UrlContentExtractorService } from "@/services/ai/url-content-extractor.service";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/services/document/document-readiness.service", () => ({
  DocumentReadinessService: {
    checkDocumentReadiness: vi.fn(),
  },
}));

vi.mock("@/services/ai/url-content-extractor.service", () => ({
  UrlContentExtractorService: {
    extractFromUrl: vi.fn(),
  },
}));

vi.mock("@/services/candidate/candidate-practice.service", () => ({
  CandidatePracticeService: {
    createResourceFromText: vi.fn(),
    createResourceFromFile: vi.fn(),
    createResourceFromUrl: vi.fn(),
    getCandidateResources: vi.fn(),
  },
}));

describe("Phase 8 API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/documents/readiness/[versionId] should return readiness report for authenticated user", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      id: "user-admin-1",
      email: "admin@exampattern.ai",
      fullName: "Admin User",
      roles: ["ADMIN"],
      permissions: ["DOCUMENT_VIEW"],
    });

    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-1",
      examName: "Health Officer",
      versionName: "2026",
      year: 2026,
      isReadyForMockGeneration: true,
      missingRequiredDocuments: [],
      blueprintReady: true,
      syllabusReady: true,
      requiredChecklist: [],
      optionalChecklist: [],
      referenceChecklist: [],
    });

    const req = new NextRequest("http://localhost:3000/api/documents/readiness/ver-1");
    const response = await readinessGet(req, {
      params: Promise.resolve({ versionId: "ver-1" }),
    });

    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.isReadyForMockGeneration).toBe(true);
  });

  it("POST /api/url-extract should return SSRF-safe content preview for valid URL", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      id: "user-cand-1",
      email: "cand@exampattern.ai",
      fullName: "Candidate User",
      roles: ["CANDIDATE"],
      permissions: [],
    });

    vi.mocked(UrlContentExtractorService.extractFromUrl).mockResolvedValue({
      url: "https://example.com/study-guide",
      hostname: "example.com",
      title: "Clinical Study Guide",
      text: "Detailed study guide text...",
      contentHash: "hash123",
      wordCount: 150,
      preview: "Detailed study guide...",
      fetchedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/url-extract", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/study-guide" }),
    });

    const response = await urlExtractPost(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.title).toBe("Clinical Study Guide");
    expect(json.data.wordCount).toBe(150);
  });

  it("POST /api/candidate/practice/resources should create a text resource", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      id: "cand-1",
      email: "cand@exampattern.ai",
      fullName: "Candidate User",
      roles: ["CANDIDATE"],
      permissions: [],
    });

    vi.mocked(CandidatePracticeService.createResourceFromText).mockResolvedValue({
      id: "res-new-1",
      candidateId: "cand-1",
      resourceType: "TEXT",
      title: "My Anatomy Notes",
      fileId: null,
      fileType: null,
      rawText: "Sample text content for practice questions.",
      sourceUrl: null,
      urlHostname: null,
      contentHash: "hash123",
      extractionStatus: "COMPLETED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/candidate/practice/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Anatomy Notes",
        text: "Sample text content for practice questions.",
      }),
    });

    const response = await practiceResourcePost(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.resource.id).toBe("res-new-1");
  });
});
