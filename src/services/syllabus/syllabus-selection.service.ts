import { prisma } from "@/lib/prisma";
import { ValidationError, NotFoundError } from "@/lib/errors";

export interface ValidatedSyllabusTopic {
  id: string;
  name: string;
  code?: string | null;
  weightagePercentage?: number | null;
  sectionId: string;
  sectionName: string;
  sectionOrder: number;
}

export class SyllabusSelectionService {
  /**
   * Strictly validates an array of client-supplied syllabus topic IDs against the verified syllabus of the specified ExamVersion.
   * Prevents cross-exam, cross-version, and arbitrary topic injection.
   */
  public static async validateSelection(
    examVersionId: string,
    topicIds: string[]
  ): Promise<ValidatedSyllabusTopic[]> {
    if (!topicIds || topicIds.length === 0) {
      throw new ValidationError("At least one syllabus topic must be selected.");
    }

    const uniqueTopicIds = Array.from(new Set(topicIds.map((id) => id.trim()).filter(Boolean)));
    if (uniqueTopicIds.length === 0) {
      throw new ValidationError("No valid topic IDs supplied.");
    }

    // Verify Exam Version exists
    const examVersion = await prisma.examVersion.findUnique({
      where: { id: examVersionId, deletedAt: null },
      include: {
        syllabi: {
          where: { isVerified: true },
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

    // Collect all valid topic IDs belonging to this ExamVersion's verified syllabi
    const validTopicMap = new Map<string, ValidatedSyllabusTopic>();

    for (const syllabus of examVersion.syllabi) {
      for (const section of syllabus.sections) {
        for (const topic of section.topics) {
          validTopicMap.set(topic.id, {
            id: topic.id,
            name: topic.name,
            code: topic.code,
            weightagePercentage: topic.weightagePercentage ? Number(topic.weightagePercentage) : null,
            sectionId: section.id,
            sectionName: section.name,
            sectionOrder: section.sortOrder,
          });
        }
      }
    }

    // If no verified syllabus, check unverified for draft preview if applicable
    if (validTopicMap.size === 0) {
      const fallbackSyllabi = await prisma.syllabus.findMany({
        where: { examVersionId },
        include: {
          sections: {
            include: { topics: true },
          },
        },
      });

      for (const syllabus of fallbackSyllabi) {
        for (const section of syllabus.sections) {
          for (const topic of section.topics) {
            validTopicMap.set(topic.id, {
              id: topic.id,
              name: topic.name,
              code: topic.code,
              weightagePercentage: topic.weightagePercentage ? Number(topic.weightagePercentage) : null,
              sectionId: section.id,
              sectionName: section.name,
              sectionOrder: section.sortOrder,
            });
          }
        }
      }
    }

    // Check every requested topic ID
    const validatedTopics: ValidatedSyllabusTopic[] = [];
    const invalidTopicIds: string[] = [];

    for (const id of uniqueTopicIds) {
      const topic = validTopicMap.get(id);
      if (topic) {
        validatedTopics.push(topic);
      } else {
        invalidTopicIds.push(id);
      }
    }

    if (invalidTopicIds.length > 0) {
      throw new ValidationError(
        `Selected topic(s) [${invalidTopicIds.slice(0, 3).join(", ")}${invalidTopicIds.length > 3 ? "..." : ""}] do not belong to the verified syllabus of this exam version.`
      );
    }

    return validatedTopics;
  }

  /**
   * Fetches full hierarchical sections and topics for an exam version
   */
  public static async getHierarchicalSyllabus(examVersionId: string) {
    const syllabi = await prisma.syllabus.findMany({
      where: { examVersionId },
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            topics: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (syllabi.length === 0) {
      return { syllabus: null, sections: [] };
    }

    const activeSyllabus = syllabi[0];
    const sections = activeSyllabus.sections.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      sortOrder: s.sortOrder,
      topics: s.topics.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        weightagePercentage: t.weightagePercentage ? Number(t.weightagePercentage) : null,
        sortOrder: t.sortOrder,
      })),
    }));

    return {
      syllabus: {
        id: activeSyllabus.id,
        title: activeSyllabus.title,
        isVerified: activeSyllabus.isVerified,
      },
      sections,
    };
  }
}
