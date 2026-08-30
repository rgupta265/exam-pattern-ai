import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { SourceQuestionGeneratorService } from "@/services/ai/source-question-generator.service";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError, BadRequestError, NotFoundError } from "@/lib/errors";

const sourceGenerator = new SourceQuestionGeneratorService();

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) throw new UnauthorizedError();

    const contentType = req.headers.get("content-type") || "";
    let examId = "";
    let examVersionId = "";
    let topicName = "";
    let difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM";
    let questionCount = 5;
    let generationMode: "SOURCE_ONLY" | "EXAM_CONTEXT_ASSISTED" = "SOURCE_ONLY";
    let rawText: string | undefined;
    let fileBuffer: Buffer | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      examId = formData.get("examId") as string;
      examVersionId = formData.get("examVersionId") as string;
      topicName = formData.get("topicName") as string;
      difficulty = ((formData.get("difficulty") as string) || "MEDIUM") as "EASY" | "MEDIUM" | "HARD";
      questionCount = parseInt((formData.get("questionCount") as string) || "5", 10);
      generationMode = ((formData.get("generationMode") as string) || "SOURCE_ONLY") as "SOURCE_ONLY" | "EXAM_CONTEXT_ASSISTED";
      rawText = (formData.get("rawText") as string) || undefined;

      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        fileBuffer = Buffer.from(bytes);
        fileName = file.name;
        mimeType = file.type;
      }
    } else {
      const json = await req.json();
      examId = json.examId;
      examVersionId = json.examVersionId;
      topicName = json.topicName;
      difficulty = json.difficulty || "MEDIUM";
      questionCount = json.questionCount || 5;
      generationMode = json.generationMode || "SOURCE_ONLY";
      rawText = json.rawText;
    }

    if (!examId || !topicName) {
      throw new BadRequestError("Parameters 'examId' and 'topicName' are required.");
    }

    // Fetch exam version & verified syllabus to load allowed scope
    const examVersion = await prisma.examVersion.findFirst({
      where: examVersionId ? { id: examVersionId } : { examId, isActive: true },
      include: {
        exam: true,
        syllabi: {
          where: { isVerified: true },
          include: { sections: { include: { topics: true } } },
          take: 1,
        },
      },
    });

    if (!examVersion) {
      throw new NotFoundError("Exam Version or verified syllabus not found.");
    }

    const syllabus = examVersion.syllabi[0];
    const allowedTopics = syllabus ? syllabus.sections.flatMap((s) => s.topics.map((t) => t.name)) : [];

    const result = await sourceGenerator.generateFromSource({
      examId: examVersion.exam.id,
      examVersionId: examVersion.id,
      examName: examVersion.exam.name,
      authority: examVersion.exam.authority,
      topicName,
      allowedTopics,
      allowedLanguages: ["English", "Hindi"],
      questionCount,
      difficulty,
      generationMode,
      fileBuffer,
      fileName,
      mimeType,
      rawText,
      userId: user.id,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
