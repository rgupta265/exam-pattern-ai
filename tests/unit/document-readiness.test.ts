import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { prisma } from "@/lib/prisma";
import { DocumentType, DocumentStatus, DocumentClassification } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    examVersion: {
      findUnique: vi.fn(),
    },
    examDocument: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    examDocumentRequirement: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

vi.mock("@/services/audit/audit.service", () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

describe("DocumentReadinessService - Document Readiness & Version Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should report NOT READY if required documents are missing", async () => {
    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue({
      id: "ver-2026",
      examId: "exam-upho",
      year: 2026,
      versionName: "2026 Regular",
      notificationNumber: "UPHO/2026/01",
      status: "ACTIVE",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      effectiveDate: null,
      description: null,
      exam: { id: "exam-upho", name: "UP Health Officer" },
      documents: [
        {
          id: "doc-1",
          examVersionId: "ver-2026",
          fileId: "file-1",
          documentType: DocumentType.OFFICIAL_NOTIFICATION,
          documentCategory: "NOTIFICATION",
          classification: DocumentClassification.REQUIRED,
          status: DocumentStatus.UPLOADED, // Not verified!
          title: "Official Notification",
          advertisementNumber: "UPHO/2026/01",
          createdAt: new Date(),
          updatedAt: new Date(),
          file: { id: "file-1", originalName: "notif.pdf", fileSize: BigInt(1024), mimeType: "application/pdf" },
        },
      ],
      documentRequirements: [],
      blueprints: [
        {
          id: "bp-1",
          title: "2026 Blueprint",
          status: "LOCKED",
          totalQuestions: 100,
          totalMarks: 100 as unknown,
          durationMinutes: 120,
          sections: [{ id: "sec-1", sectionOrder: 1 }],
        },
      ],
      syllabi: [
        {
          id: "syl-1",
          title: "2026 Syllabus",
          isVerified: true,
          sections: [{ id: "syl-sec-1", topics: [{ id: "top-1" }] }],
        },
      ],
    } as any);

    const report = await DocumentReadinessService.checkDocumentReadiness("ver-2026");

    expect(report.isReadyForMockGeneration).toBe(false);
    expect(report.missingRequiredDocuments).toContain(DocumentType.OFFICIAL_NOTIFICATION);
    expect(report.missingRequiredDocuments).toContain(DocumentType.EXAM_PATTERN);
    expect(report.missingRequiredDocuments).toContain(DocumentType.SYLLABUS);
  });

  it("should report READY when all required documents, locked blueprint, and verified syllabus exist", async () => {
    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue({
      id: "ver-2026",
      examId: "exam-upho",
      year: 2026,
      versionName: "2026 Regular",
      notificationNumber: "UPHO/2026/01",
      status: "ACTIVE",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      effectiveDate: null,
      description: null,
      exam: { id: "exam-upho", name: "UP Health Officer" },
      documents: [
        {
          id: "doc-1",
          examVersionId: "ver-2026",
          fileId: "file-1",
          documentType: DocumentType.OFFICIAL_NOTIFICATION,
          classification: DocumentClassification.REQUIRED,
          status: DocumentStatus.VERIFIED,
          title: "Official Notification",
          createdAt: new Date(),
          updatedAt: new Date(),
          file: { id: "file-1", originalName: "notif.pdf", fileSize: BigInt(1024), mimeType: "application/pdf" },
        },
        {
          id: "doc-2",
          examVersionId: "ver-2026",
          fileId: "file-2",
          documentType: DocumentType.EXAM_PATTERN,
          classification: DocumentClassification.REQUIRED,
          status: DocumentStatus.VERIFIED,
          title: "Exam Pattern",
          createdAt: new Date(),
          updatedAt: new Date(),
          file: { id: "file-2", originalName: "pattern.pdf", fileSize: BigInt(1024), mimeType: "application/pdf" },
        },
        {
          id: "doc-3",
          examVersionId: "ver-2026",
          fileId: "file-3",
          documentType: DocumentType.SYLLABUS,
          classification: DocumentClassification.REQUIRED,
          status: DocumentStatus.VERIFIED,
          title: "Official Syllabus",
          createdAt: new Date(),
          updatedAt: new Date(),
          file: { id: "file-3", originalName: "syllabus.pdf", fileSize: BigInt(1024), mimeType: "application/pdf" },
        },
      ],
      documentRequirements: [],
      blueprints: [
        {
          id: "bp-1",
          title: "2026 Blueprint",
          status: "LOCKED",
          totalQuestions: 100,
          totalMarks: 100 as unknown,
          durationMinutes: 120,
          sections: [{ id: "sec-1", sectionOrder: 1 }],
        },
      ],
      syllabi: [
        {
          id: "syl-1",
          title: "2026 Syllabus",
          isVerified: true,
          sections: [{ id: "syl-sec-1", topics: [{ id: "top-1" }] }],
        },
      ],
    } as any);

    const report = await DocumentReadinessService.checkDocumentReadiness("ver-2026");

    expect(report.isReadyForMockGeneration).toBe(true);
    expect(report.missingRequiredDocuments.length).toBe(0);
    expect(report.blueprintReady).toBe(true);
    expect(report.syllabusReady).toBe(true);
  });
});
