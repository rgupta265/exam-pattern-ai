import { prisma } from "@/lib/prisma";
import { storageService } from "@/services/storage";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { NotFoundError } from "@/lib/errors";
import { DocumentType } from "@prisma/client";

export class DocumentService {
  public static async getDocumentsByVersion(examVersionId: string) {
    return prisma.examDocument.findMany({
      where: { examVersionId },
      orderBy: { createdAt: "desc" },
      include: {
        file: true,
        uploadedBy: { select: { id: true, fullName: true, email: true } },
        jobs: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  public static async getDocumentById(id: string) {
    const document = await prisma.examDocument.findUnique({
      where: { id },
      include: {
        file: true,
        examVersion: {
          include: {
            exam: { include: { category: true } },
          },
        },
        uploadedBy: { select: { id: true, fullName: true, email: true } },
        jobs: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!document) {
      throw new NotFoundError("Exam Document");
    }

    return document;
  }

  public static async uploadDocument(params: {
    examVersionId: string;
    fileBuffer: Buffer;
    originalFileName: string;
    mimeType: string;
    documentType: DocumentType;
    title: string;
    user: SessionUser;
    ip?: string;
    userAgent?: string;
  }) {
    RbacService.requirePermission(params.user, PERMISSIONS.DOCUMENT_UPLOAD);

    const version = await prisma.examVersion.findFirst({
      where: { id: params.examVersionId, deletedAt: null },
    });
    if (!version) {
      throw new NotFoundError("Exam Version");
    }

    // 1. Save file to storage with checksum validation
    const storedFile = await storageService.saveFile(
      params.fileBuffer,
      params.originalFileName,
      params.mimeType,
      {
        folder: "notifications",
        visibility: "PRIVATE",
        maxSizeBytes: 50 * 1024 * 1024, // 50MB max for notifications
      }
    );

    // 2. Create ExamDocument record
    const document = await prisma.examDocument.create({
      data: {
        examVersionId: params.examVersionId,
        fileId: storedFile.id,
        documentType: params.documentType,
        title: params.title.trim(),
        uploadedById: params.user.id,
      },
      include: {
        file: true,
        uploadedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    // 3. Create initial pending processing job
    const job = await prisma.documentProcessingJob.create({
      data: {
        documentId: document.id,
        jobType: "AI_PATTERN_AND_SYLLABUS_EXTRACTION",
        status: "PENDING",
      },
    });

    await AuditService.log({
      userId: params.user.id,
      action: "DOCUMENT_UPLOAD",
      resourceType: "ExamDocument",
      resourceId: document.id,
      ipAddress: params.ip,
      userAgent: params.userAgent,
      changesDiff: {
        documentId: document.id,
        fileId: storedFile.id,
        jobId: job.id,
        documentType: params.documentType,
      },
    });

    return { document, job };
  }
}
