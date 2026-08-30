import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";

export interface MockValidationCheckItem {
  name: string;
  passed: boolean;
  expected: string | number;
  actual: string | number;
  details?: string;
}

export interface MockValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: MockValidationCheckItem[];
}

export class MockPatternValidatorService {
  /**
   * Run 100% compliance validation checks against locked exam blueprint
   */
  public static async validate(mockTestId: string): Promise<MockValidationReport> {
    const mock = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        blueprint: {
          include: { sections: { orderBy: { sectionOrder: "asc" } } },
        },
        sections: {
          orderBy: { sectionOrder: "asc" },
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    topic: {
                      include: {
                        section: {
                          include: { syllabus: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mock) {
      throw new NotFoundError("Mock Test");
    }

    const checks: MockValidationCheckItem[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // For TOPIC_PRACTICE, perform topic-specific validation
    if (mock.type === "TOPIC_PRACTICE" || !mock.blueprint) {
      let totalQuestions = 0;
      const seenQIds = new Set<string>();

      for (const sec of mock.sections) {
        totalQuestions += sec.questions.length;
        for (const mq of sec.questions) {
          if (seenQIds.has(mq.questionId)) {
            errors.push(`Duplicate question found in mock test: ${mq.questionId}`);
          }
          seenQIds.add(mq.questionId);
        }
      }

      checks.push({
        name: "Question Count Match",
        passed: totalQuestions === mock.totalQuestions,
        expected: mock.totalQuestions,
        actual: totalQuestions,
      });

      checks.push({
        name: "Zero Duplicate Questions",
        passed: seenQIds.size === totalQuestions,
        expected: totalQuestions,
        actual: seenQIds.size,
      });

      const isValid = errors.length === 0;

      await prisma.mockValidationResult.create({
        data: {
          mockTestId,
          isValid,
          scoreReport: { checks } as unknown as Prisma.InputJsonValue,
          errorSummary: errors.length > 0 ? errors.join("; ") : null,
        },
      });

      return { isValid, errors, warnings, checks };
    }

    const bp = mock.blueprint;

    // 1. Check Total Questions
    let calculatedQuestions = 0;
    mock.sections.forEach((s) => {
      calculatedQuestions += s.questions.length;
    });

    const totalQPass = calculatedQuestions === bp.totalQuestions;
    checks.push({
      name: "Total Questions Match",
      passed: totalQPass,
      expected: bp.totalQuestions,
      actual: calculatedQuestions,
      details: totalQPass
        ? "Total question count matches verified blueprint."
        : `Expected ${bp.totalQuestions}, found ${calculatedQuestions}.`,
    });
    if (!totalQPass) errors.push(`Total questions (${calculatedQuestions}) != Blueprint (${bp.totalQuestions})`);

    // 2. Check Total Marks
    let calculatedMarks = 0;
    mock.sections.forEach((s) => {
      s.questions.forEach((mq) => {
        calculatedMarks += Number(mq.marks);
      });
    });

    const bpMarks = Number(bp.totalMarks);
    const totalMarksPass = Math.abs(calculatedMarks - bpMarks) <= 0.01;
    checks.push({
      name: "Total Marks Match",
      passed: totalMarksPass,
      expected: bpMarks,
      actual: calculatedMarks,
      details: totalMarksPass
        ? "Total aggregate marks match verified blueprint."
        : `Expected ${bpMarks}, found ${calculatedMarks}.`,
    });
    if (!totalMarksPass) errors.push(`Total marks (${calculatedMarks}) != Blueprint (${bpMarks})`);

    // 3. Check Duration
    const durationPass = mock.durationMinutes === bp.durationMinutes;
    checks.push({
      name: "Exam Duration Match",
      passed: durationPass,
      expected: bp.durationMinutes,
      actual: mock.durationMinutes,
    });
    if (!durationPass) errors.push(`Duration (${mock.durationMinutes}m) != Blueprint (${bp.durationMinutes}m)`);

    // 4. Check Section-by-Section Structure
    const secCountPass = mock.sections.length === bp.sections.length;
    checks.push({
      name: "Section Count Match",
      passed: secCountPass,
      expected: bp.sections.length,
      actual: mock.sections.length,
    });
    if (!secCountPass) errors.push(`Section count (${mock.sections.length}) != Blueprint (${bp.sections.length})`);

    for (let i = 0; i < bp.sections.length; i++) {
      const bpSec = bp.sections[i];
      const mockSec = mock.sections.find((s) => s.sectionOrder === bpSec.sectionOrder);

      if (!mockSec) {
        errors.push(`Missing Section ${bpSec.sectionOrder} (${bpSec.name})`);
        continue;
      }

      const qCountMatch = mockSec.questions.length === bpSec.questionCount;
      checks.push({
        name: `Section ${bpSec.sectionOrder} Question Count`,
        passed: qCountMatch,
        expected: bpSec.questionCount,
        actual: mockSec.questions.length,
        details: `Section: ${bpSec.name}`,
      });
      if (!qCountMatch) {
        errors.push(`Section ${bpSec.sectionOrder} questions (${mockSec.questions.length}) != Blueprint (${bpSec.questionCount})`);
      }
    }

    // 5. Check Duplicate Questions Across Mock
    const questionIds = new Set<string>();
    let duplicateCount = 0;
    mock.sections.forEach((sec) => {
      sec.questions.forEach((mq) => {
        if (questionIds.has(mq.questionId)) duplicateCount++;
        questionIds.add(mq.questionId);
      });
    });

    const noDuplicates = duplicateCount === 0;
    checks.push({
      name: "Zero Duplicate Questions",
      passed: noDuplicates,
      expected: 0,
      actual: duplicateCount,
      details: noDuplicates ? "Zero duplicates detected." : `Found ${duplicateCount} duplicate questions.`,
    });
    if (!noDuplicates) errors.push(`Found ${duplicateCount} duplicate questions in mock.`);

    // 6. Check 100% Syllabus Alignment
    let unmappedCount = 0;
    mock.sections.forEach((sec) => {
      sec.questions.forEach((mq) => {
        const topic = mq.question.topic;
        if (!topic || topic.section.syllabus.examVersionId !== mock.examVersionId) {
          unmappedCount++;
        }
      });
    });

    const syllabusPass = unmappedCount === 0;
    checks.push({
      name: "100% Syllabus Alignment",
      passed: syllabusPass,
      expected: 0,
      actual: unmappedCount,
      details: syllabusPass
        ? "Every question maps to a valid node in the verified syllabus."
        : `Found ${unmappedCount} questions outside verified syllabus.`,
    });
    if (!syllabusPass) errors.push(`Found ${unmappedCount} questions not in verified syllabus.`);

    const isValid = errors.length === 0;

    // Save validation result report
    await prisma.mockValidationResult.create({
      data: {
        mockTestId,
        isValid,
        scoreReport: { checks, calculatedQuestions, calculatedMarks } as unknown as Prisma.InputJsonValue,
        errorSummary: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    // Update MockTest status
    await prisma.mockTest.update({
      where: { id: mockTestId },
      data: {
        status: isValid ? "VALIDATED" : "VALIDATION_FAILED",
      },
    });

    return {
      isValid,
      errors,
      warnings,
      checks,
    };
  }
}
