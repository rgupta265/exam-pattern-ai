import { prisma } from "@/lib/prisma";
import { DocumentClassification, DocumentStatus, DocumentType } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { SessionUser } from "@/types/auth.types";
import { RbacService } from "@/services/rbac/rbac.service";
import { PERMISSIONS } from "@/lib/constants";
import { AuditService } from "@/services/audit/audit.service";

export interface DocumentChecklistItem {
  documentType: DocumentType;
  classification: DocumentClassification;
  isMandatory: boolean;
  isVerified: boolean;
  verifiedCount: number;
  totalUploaded: number;
  description?: string | null;
}

export interface ExamVersionReadinessReport {
  examVersionId: string;
  examName: string;
  versionName: string;
  year: number;
  notificationNumber?: string | null;
  isReadyForMockGeneration: boolean;
  missingRequiredDocuments: DocumentType[];
  blueprintReady: boolean;
  blueprintDetails?: {
    id: string;
    title: string;
    status: string;
    totalQuestions: number;
    totalMarks: number;
    durationMinutes: number;
    sectionsCount: number;
  };
  syllabusReady: boolean;
  syllabusDetails?: {
    id: string;
    title: string;
    isVerified: boolean;
    sectionsCount: number;
    topicsCount: number;
  };
  requiredChecklist: DocumentChecklistItem[];
  optionalChecklist: DocumentChecklistItem[];
  referenceChecklist: DocumentChecklistItem[];
}

export class DocumentReadinessService {
  /**
   * Default required document types if no explicit custom requirements are configured
   */
  public static readonly DEFAULT_REQUIRED_TYPES: DocumentType[] = [
    DocumentType.OFFICIAL_NOTIFICATION,
    DocumentType.EXAM_PATTERN,
    DocumentType.SYLLABUS,
  ];

  /**
   * Checks complete document, blueprint, and syllabus readiness for a specific ExamVersion
   */
  public static async checkDocumentReadiness(examVersionId: string): Promise<ExamVersionReadinessReport> {
    const examVersion = await prisma.examVersion.findUnique({
      where: { id: examVersionId, deletedAt: null },
      include: {
        exam: true,
        documents: {
          include: { file: true },
        },
        documentRequirements: true,
        blueprints: {
          where: { status: { in: ["LOCKED", "ACTIVE", "VERIFIED"] } },
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { sections: { orderBy: { sectionOrder: "asc" } } },
        },
        syllabi: {
          where: { isVerified: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sections: {
              include: { topics: true },
            },
          },
        },
      },
    });

    if (!examVersion) {
      throw new NotFoundError("Exam Version");
    }

    // 1. Gather configured requirements or fallback to defaults
    const requirements = examVersion.documentRequirements;
    const requiredTypes: DocumentType[] =
      requirements.length > 0
        ? requirements
            .filter((r) => r.classification === "REQUIRED" && r.isMandatory)
            .map((r) => r.documentType)
        : this.DEFAULT_REQUIRED_TYPES;

    // 2. Evaluate verified documents per type
    const verifiedTypeCounts = new Map<DocumentType, number>();
    const totalTypeCounts = new Map<DocumentType, number>();

    for (const doc of examVersion.documents) {
      totalTypeCounts.set(doc.documentType, (totalTypeCounts.get(doc.documentType) || 0) + 1);
      if (doc.status === "VERIFIED") {
        verifiedTypeCounts.set(doc.documentType, (verifiedTypeCounts.get(doc.documentType) || 0) + 1);
      }
    }

    // Handle legacy/alias mappings (e.g. NOTIFICATION alias for OFFICIAL_NOTIFICATION)
    if (verifiedTypeCounts.get(DocumentType.NOTIFICATION)) {
      const count = verifiedTypeCounts.get(DocumentType.NOTIFICATION)!;
      verifiedTypeCounts.set(
        DocumentType.OFFICIAL_NOTIFICATION,
        (verifiedTypeCounts.get(DocumentType.OFFICIAL_NOTIFICATION) || 0) + count
      );
    }

    const missingRequiredDocuments: DocumentType[] = [];
    const requiredChecklist: DocumentChecklistItem[] = [];
    const optionalChecklist: DocumentChecklistItem[] = [];
    const referenceChecklist: DocumentChecklistItem[] = [];

    // Process required types
    for (const reqType of requiredTypes) {
      const count = verifiedTypeCounts.get(reqType) || 0;
      const total = totalTypeCounts.get(reqType) || 0;
      const isVerified = count > 0;

      if (!isVerified) {
        missingRequiredDocuments.push(reqType);
      }

      requiredChecklist.push({
        documentType: reqType,
        classification: "REQUIRED",
        isMandatory: true,
        isVerified,
        verifiedCount: count,
        totalUploaded: total,
      });
    }

    // Process other document types present in requirements or uploads
    const allKnownTypes = Array.from(
      new Set([
        ...Object.values(DocumentType),
        ...requirements.map((r) => r.documentType),
        ...examVersion.documents.map((d) => d.documentType),
      ])
    );

    for (const docType of allKnownTypes) {
      if (requiredTypes.includes(docType)) continue;

      const reqConfig = requirements.find((r) => r.documentType === docType);
      const count = verifiedTypeCounts.get(docType) || 0;
      const total = totalTypeCounts.get(docType) || 0;
      const classification = reqConfig?.classification || (docType === "REFERENCE_MATERIAL" ? "REFERENCE" : "OPTIONAL");

      const item: DocumentChecklistItem = {
        documentType: docType,
        classification,
        isMandatory: false,
        isVerified: count > 0,
        verifiedCount: count,
        totalUploaded: total,
        description: reqConfig?.description,
      };

      if (classification === "REFERENCE") {
        referenceChecklist.push(item);
      } else {
        optionalChecklist.push(item);
      }
    }

    // 3. Blueprint Readiness Check
    const activeBlueprint = examVersion.blueprints[0];
    const blueprintReady =
      !!activeBlueprint &&
      activeBlueprint.sections.length > 0 &&
      activeBlueprint.totalQuestions > 0;

    // 4. Syllabus Readiness Check
    const activeSyllabus = examVersion.syllabi[0];
    const totalSyllabusTopics = activeSyllabus?.sections.reduce((acc, s) => acc + s.topics.length, 0) || 0;
    const syllabusReady =
      !!activeSyllabus &&
      activeSyllabus.isVerified &&
      activeSyllabus.sections.length > 0 &&
      totalSyllabusTopics > 0;

    // Overall Readiness for Actual Pattern Mock Generation
    const isReadyForMockGeneration =
      missingRequiredDocuments.length === 0 &&
      blueprintReady &&
      syllabusReady;

    return {
      examVersionId: examVersion.id,
      examName: examVersion.exam.name,
      versionName: examVersion.versionName,
      year: examVersion.year,
      notificationNumber: examVersion.notificationNumber,
      isReadyForMockGeneration,
      missingRequiredDocuments,
      blueprintReady,
      blueprintDetails: activeBlueprint
        ? {
            id: activeBlueprint.id,
            title: activeBlueprint.title,
            status: activeBlueprint.status,
            totalQuestions: activeBlueprint.totalQuestions,
            totalMarks: Number(activeBlueprint.totalMarks),
            durationMinutes: activeBlueprint.durationMinutes,
            sectionsCount: activeBlueprint.sections.length,
          }
        : undefined,
      syllabusReady,
      syllabusDetails: activeSyllabus
        ? {
            id: activeSyllabus.id,
            title: activeSyllabus.title,
            isVerified: activeSyllabus.isVerified,
            sectionsCount: activeSyllabus.sections.length,
            topicsCount: totalSyllabusTopics,
          }
        : undefined,
      requiredChecklist,
      optionalChecklist,
      referenceChecklist,
    };
  }

  /**
   * Admin verifies an uploaded official exam document
   */
  public static async verifyDocument(
    documentId: string,
    user: SessionUser,
    notes?: string,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.DOCUMENT_PROCESS);

    const doc = await prisma.examDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundError("Exam Document");
    }

    const updated = await prisma.examDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.VERIFIED,
        verifiedById: user.id,
        verifiedAt: new Date(),
        verificationNotes: notes ? notes.trim() : doc.verificationNotes,
      },
      include: {
        file: true,
        verifiedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "DOCUMENT_VERIFIED",
      resourceType: "ExamDocument",
      resourceId: documentId,
      ipAddress: ip,
      userAgent,
      changesDiff: {
        previousStatus: doc.status,
        newStatus: DocumentStatus.VERIFIED,
        notes,
      },
    });

    return updated;
  }

  /**
   * Admin rejects an uploaded document
   */
  public static async rejectDocument(
    documentId: string,
    user: SessionUser,
    reason: string,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.DOCUMENT_PROCESS);

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError("Rejection reason is required.");
    }

    const doc = await prisma.examDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundError("Exam Document");
    }

    const updated = await prisma.examDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.REJECTED,
        verificationNotes: reason.trim(),
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "DOCUMENT_REJECTED",
      resourceType: "ExamDocument",
      resourceId: documentId,
      ipAddress: ip,
      userAgent,
      changesDiff: {
        previousStatus: doc.status,
        newStatus: DocumentStatus.REJECTED,
        reason,
      },
    });

    return updated;
  }

  /**
   * Configure custom required/optional/reference document rules for an exam version
   */
  public static async configureRequirements(
    examVersionId: string,
    requirements: Array<{
      documentType: DocumentType;
      classification: DocumentClassification;
      isMandatory: boolean;
      description?: string;
    }>,
    user: SessionUser
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_UPDATE);

    const version = await prisma.examVersion.findUnique({
      where: { id: examVersionId, deletedAt: null },
    });

    if (!version) {
      throw new NotFoundError("Exam Version");
    }

    // Upsert requirements in transaction
    const results = await prisma.$transaction(
      requirements.map((req) =>
        prisma.examDocumentRequirement.upsert({
          where: {
            examVersionId_documentType: {
              examVersionId,
              documentType: req.documentType,
            },
          },
          create: {
            examVersionId,
            documentType: req.documentType,
            classification: req.classification,
            isMandatory: req.isMandatory,
            description: req.description,
          },
          update: {
            classification: req.classification,
            isMandatory: req.isMandatory,
            description: req.description,
          },
        })
      )
    );

    return results;
  }
}
