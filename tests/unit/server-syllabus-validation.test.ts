import { describe, it, expect } from "vitest";

describe("Server-Side Syllabus Topic Validation Unit Tests", () => {
  const verifiedSyllabusMap: Record<string, { examVersionId: string; name: string }> = {
    "topic-101": { examVersionId: "ver-2026", name: "Community Health Nursing" },
    "topic-102": { examVersionId: "ver-2026", name: "Maternal Health" },
    "topic-999": { examVersionId: "ver-OTHER-EXAM", name: "Railway Engineering" },
  };

  const validateTopicSelection = (requestedTopicIds: string[], targetVersionId: string) => {
    if (!requestedTopicIds || requestedTopicIds.length === 0) {
      return { isValid: false, error: "At least one syllabus topic must be selected." };
    }

    for (const id of requestedTopicIds) {
      const topic = verifiedSyllabusMap[id];
      if (!topic) {
        return { isValid: false, error: `Topic '${id}' not found in database.` };
      }
      if (topic.examVersionId !== targetVersionId) {
        return {
          isValid: false,
          error: `Topic '${topic.name}' belongs to another exam version (${topic.examVersionId}).`,
        };
      }
    }

    return { isValid: true, validTopics: requestedTopicIds.map((id) => verifiedSyllabusMap[id]) };
  };

  it("should pass when all selected topics belong to the target exam version", () => {
    const res = validateTopicSelection(["topic-101", "topic-102"], "ver-2026");
    expect(res.isValid).toBe(true);
    expect(res.validTopics?.length).toBe(2);
  });

  it("should reject when empty topic list is submitted", () => {
    const res = validateTopicSelection([], "ver-2026");
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("At least one syllabus topic");
  });

  it("should reject when a topic from another exam is submitted", () => {
    const res = validateTopicSelection(["topic-101", "topic-999"], "ver-2026");
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("Railway Engineering");
  });
});
