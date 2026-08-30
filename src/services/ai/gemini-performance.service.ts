import { geminiProvider, GeminiProvider } from "./gemini.provider";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const geminiPerformanceAnalysisSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  studyPriorities: z.array(
    z.object({
      topicName: z.string(),
      reason: z.string(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
    })
  ),
});

export type GeminiPerformanceAnalysis = z.infer<typeof geminiPerformanceAnalysisSchema>;

export class GeminiPerformanceService {
  private readonly provider: GeminiProvider;

  constructor(provider?: GeminiProvider) {
    this.provider = provider || geminiProvider;
  }

  /**
   * Generate Gemini diagnostic performance feedback based on test results
   */
  public async generateDiagnosticReport(resultId: string): Promise<GeminiPerformanceAnalysis> {
    const result = await prisma.testResult.findFirst({
      where: {
        OR: [
          { id: resultId },
          { attemptId: resultId },
        ],
      },
      include: {
        attempt: {
          include: {
            mockTest: {
              include: { examVersion: { include: { exam: true } } },
            },
          },
        },
        sectionResults: true,
        topicResults: true,
      },
    });

    if (!result) {
      throw new Error("Result not found");
    }

    const examName = result.attempt.mockTest.examVersion.exam.name;
    const score = Number(result.netScore);
    const totalMarks = Number(result.totalMarks);
    const accuracy = Number(result.accuracyRate);

    const topicBreakdown = result.topicResults
      .map((t) => `- ${t.topicName}: ${t.correct}/${t.totalQuestions} correct (${Number(t.accuracy).toFixed(1)}% accuracy)`)
      .join("\n");

    const prompt = `You are a Senior Exam Performance Analyst and Mentor for ExamPattern AI.
Analyze the candidate's performance in the following exam attempt and provide diagnostic feedback and personalized study recommendations.

=== EXAM RESULT DATA ===
Exam: ${examName}
Mock Test: ${result.attempt.mockTest.title}
Net Score: ${score} / ${totalMarks} (${Number(result.percentage).toFixed(1)}%)
Accuracy Rate: ${accuracy.toFixed(1)}%
Total Questions: ${result.totalQuestions} (Attempted: ${result.attemptedQuestions}, Correct: ${result.correctAnswers}, Incorrect: ${result.incorrectAnswers})

Topic Performance:
${topicBreakdown}

=== INSTRUCTIONS ===
1. Analyze weak vs strong topics objectively.
2. Formulate 3-4 actionable recommendations to reduce negative marking and improve accuracy.
3. Suggest 2-3 highest priority study topics based on lower accuracy rates.
4. Output MUST be valid JSON adhering to the schema below.

JSON Format:
{
  "summary": "Overall assessment of performance...",
  "strengths": ["Strong clinical knowledge in ...", "High accuracy in ..."],
  "weaknesses": ["Low accuracy in ...", "High negative deduction in ..."],
  "recommendations": ["Focus on revision of ...", "Practice time management ..."],
  "studyPriorities": [
    { "topicName": "...", "reason": "...", "priority": "HIGH" }
  ]
}`;

    try {
      const rawResponse = await this.provider.generateContent(prompt, {
        temperature: 0.3,
        responseMimeType: "application/json",
      });

      const cleanJson = rawResponse
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      const validated = geminiPerformanceAnalysisSchema.parse(parsed);

      // Save feedback text back to testResult
      await prisma.testResult.update({
        where: { id: resultId },
        data: { geminiFeedback: validated.summary },
      });

      return validated;
    } catch {
      // Fallback deterministic analysis
      const fallbackReport: GeminiPerformanceAnalysis = {
        summary: `You scored ${score} out of ${totalMarks} with an overall accuracy of ${accuracy.toFixed(1)}%. Review the topics below to enhance conceptual clarity and minimize negative penalty deductions.`,
        strengths: result.topicResults
          .filter((t) => Number(t.accuracy) >= 60)
          .map((t) => `Solid grasp of ${t.topicName} with ${Number(t.accuracy).toFixed(0)}% accuracy`),
        weaknesses: result.topicResults
          .filter((t) => Number(t.accuracy) < 60)
          .map((t) => `Needs reinforcement in ${t.topicName} (${Number(t.accuracy).toFixed(0)}% accuracy)`),
        recommendations: [
          "Review step-by-step rationales for incorrect questions to identify knowledge gaps.",
          "Target weak syllabus nodes before attempting the next full-pattern mock.",
          "Avoid guessing on uncertain questions to minimize negative penalty loss.",
        ],
        studyPriorities: result.topicResults
          .filter((t) => Number(t.accuracy) < 60)
          .slice(0, 3)
          .map((t) => ({
            topicName: t.topicName,
            reason: `Low accuracy rate of ${Number(t.accuracy).toFixed(0)}% indicates conceptual gaps.`,
            priority: "HIGH" as const,
          })),
      };

      await prisma.testResult.update({
        where: { id: resultId },
        data: { geminiFeedback: fallbackReport.summary },
      });

      return fallbackReport;
    }
  }
}

export const geminiPerformanceService = new GeminiPerformanceService();
