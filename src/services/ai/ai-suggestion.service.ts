import { prisma } from "@/lib/prisma";
import { MockTestType, DifficultyLevel } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";

export interface AISuggestion {
  id: string;
  title: string;
  titleHindi?: string;
  description: string;
  descriptionHindi?: string;
  mockType: MockTestType;
  examId: string;
  examVersionId: string;
  topicId?: string;
  topicName?: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  durationMinutes: number;
  language: string;
  action: "GENERATE_MOCK" | "GENERATE_QUESTIONS";
}

export class AISuggestionService {
  /**
   * Generates contextual, blueprint-aligned practice suggestions for a given exam version
   */
  public static async getSuggestionsForExam(
    examId: string,
    examVersionId?: string
  ): Promise<AISuggestion[]> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        versions: {
          where: examVersionId ? { id: examVersionId } : { isActive: true },
          include: {
            blueprints: {
              where: { status: { in: ["VERIFIED", "LOCKED", "ACTIVE"] } },
              include: { sections: true },
              take: 1,
            },
            syllabi: {
              where: { isVerified: true },
              include: {
                sections: {
                  include: { topics: true },
                },
              },
              take: 1,
            },
          },
          take: 1,
        },
      },
    });

    if (!exam || exam.versions.length === 0) {
      throw new NotFoundError("Exam or active version not found.");
    }

    const version = exam.versions[0];
    const blueprint = version.blueprints[0];
    const syllabus = version.syllabi[0];

    const suggestions: AISuggestion[] = [];
    const targetVersionId = version.id;

    // 1. Full Pattern Official Mock Suggestion
    if (blueprint) {
      suggestions.push({
        id: `sug-full-${targetVersionId}`,
        title: `Full Pattern Official Mock (${blueprint.totalQuestions} Qs)`,
        titleHindi: `संपूर्ण आधिकारिक पैटर्न मॉक टेस्ट (${blueprint.totalQuestions} प्रश्न)`,
        description: `Strictly mirrors the locked official blueprint with ${blueprint.sections.length} sections and ${blueprint.durationMinutes} minutes timer.`,
        descriptionHindi: `लॉक किए गए आधिकारिक ब्लूप्रिंट के अनुसार ${blueprint.sections.length} खंड और ${blueprint.durationMinutes} मिनट का समय।`,
        mockType: MockTestType.FULL_MOCK,
        examId: exam.id,
        examVersionId: targetVersionId,
        difficulty: DifficultyLevel.MEDIUM,
        questionCount: blueprint.totalQuestions,
        durationMinutes: blueprint.durationMinutes,
        language: "BILINGUAL",
        action: "GENERATE_MOCK",
      });
    }

    // 2. Syllabus Topic-Specific Drills
    if (syllabus && syllabus.sections.length > 0) {
      const allTopics = syllabus.sections.flatMap((s) => s.topics);
      const primaryTopics = allTopics.slice(0, 3);

      for (const topic of primaryTopics) {
        suggestions.push({
          id: `sug-topic-${topic.id}`,
          title: `Targeted Topic Practice: ${topic.name}`,
          titleHindi: `लक्षित विषय अभ्यास: ${topic.name}`,
          description: `Focused 20-question practice drill exclusively targeting ${topic.name} syllabus concepts.`,
          descriptionHindi: `${topic.name} पाठ्यक्रम के महत्वपूर्ण 20 प्रश्नों का गहन अभ्यास।`,
          mockType: MockTestType.TOPIC_PRACTICE,
          examId: exam.id,
          examVersionId: targetVersionId,
          topicId: topic.id,
          topicName: topic.name,
          difficulty: DifficultyLevel.MEDIUM,
          questionCount: 20,
          durationMinutes: 25,
          language: "BILINGUAL",
          action: "GENERATE_QUESTIONS",
        });
      }

      // 3. High Difficulty Revision Drill
      if (allTopics.length > 0) {
        suggestions.push({
          id: `sug-hard-${targetVersionId}`,
          title: `Advanced High-Difficulty Challenge Drill`,
          titleHindi: `उन्नत उच्च-कठिनाई चुनौती ड्रिल`,
          description: `Challenging conceptual and multi-step questions across core ${exam.name} syllabus topics.`,
          descriptionHindi: `${exam.name} के मुख्य विषयों से संबंधित उच्च स्तरीय विश्लेषणात्मक प्रश्न।`,
          mockType: MockTestType.AI_PRACTICE,
          examId: exam.id,
          examVersionId: targetVersionId,
          difficulty: DifficultyLevel.HARD,
          questionCount: 25,
          durationMinutes: 30,
          language: "BILINGUAL",
          action: "GENERATE_MOCK",
        });
      }
    }

    return suggestions;
  }
}
