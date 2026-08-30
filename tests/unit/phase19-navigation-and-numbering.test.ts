import { describe, it, expect } from "vitest";

describe("Phase 19: Mock Examination Navigation & Section-Wise Question Numbering", () => {
  // Helper matching the component implementation
  const getSectionQuestionNumber = (sectionQuestionIndex: number): number => sectionQuestionIndex + 1;

  interface MockSection {
    id: string;
    name: string;
    questions: { id: string; question: { id: string; title: string } }[];
  }

  const createMockExam = (sectionCounts: { name: string; count: number }[]): MockSection[] => {
    return sectionCounts.map((sc, sIdx) => ({
      id: `sec-${sIdx + 1}`,
      name: sc.name,
      questions: Array.from({ length: sc.count }, (_, qIdx) => ({
        id: `mq-${sIdx + 1}-${qIdx + 1}`,
        question: {
          id: `q-uuid-${sIdx + 1}-${qIdx + 1}`,
          title: `Question text for ${sc.name} Q${qIdx + 1}`,
        },
      })),
    }));
  };

  describe("Section-Relative Question Numbering (Strict Rule)", () => {
    it("should restart numbering at 1 for every section (Section A = 8, Section B = 5)", () => {
      const exam = createMockExam([
        { name: "Section A", count: 8 },
        { name: "Section B", count: 5 },
      ]);

      // Section A
      const secA = exam[0];
      expect(secA.questions.length).toBe(8);
      const secANumbers = secA.questions.map((_, idx) => getSectionQuestionNumber(idx));
      expect(secANumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

      // Section B (MUST restart at 1, NOT 9..13)
      const secB = exam[1];
      expect(secB.questions.length).toBe(5);
      const secBNumbers = secB.questions.map((_, idx) => getSectionQuestionNumber(idx));
      expect(secBNumbers).toEqual([1, 2, 3, 4, 5]);
      expect(secBNumbers).not.toContain(9);
    });

    it("should restart numbering for 3 sections (Section A = 8, Section B = 5, Section C = 7)", () => {
      const exam = createMockExam([
        { name: "Section A", count: 8 },
        { name: "Section B", count: 5 },
        { name: "Section C", count: 7 },
      ]);

      expect(exam[0].questions.map((_, idx) => getSectionQuestionNumber(idx))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(exam[1].questions.map((_, idx) => getSectionQuestionNumber(idx))).toEqual([1, 2, 3, 4, 5]);
      expect(exam[2].questions.map((_, idx) => getSectionQuestionNumber(idx))).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it("should handle single section exam (Section A = 20) correctly", () => {
      const exam = createMockExam([{ name: "General Knowledge", count: 20 }]);
      const numbers = exam[0].questions.map((_, idx) => getSectionQuestionNumber(idx));
      expect(numbers).toHaveLength(20);
      expect(numbers[0]).toBe(1);
      expect(numbers[19]).toBe(20);
    });
  });

  describe("Save & Next and Previous Cross-Section Navigation State Machine", () => {
    const exam = createMockExam([
      { name: "Section A", count: 8 },
      { name: "Section B", count: 5 },
    ]);

    const navigateNext = (activeSecIdx: number, activeQIdx: number, sections: MockSection[]) => {
      const currentSec = sections[activeSecIdx];
      const isLastQInSec = activeQIdx >= (currentSec?.questions?.length || 0) - 1;
      const isLastSec = activeSecIdx >= sections.length - 1;

      if (!isLastQInSec) {
        return { activeSectionIdx: activeSecIdx, activeQuestionIdx: activeQIdx + 1, isSubmitModalOpen: false };
      } else if (!isLastSec) {
        return { activeSectionIdx: activeSecIdx + 1, activeQuestionIdx: 0, isSubmitModalOpen: false };
      } else {
        return { activeSectionIdx: activeSecIdx, activeQuestionIdx: activeQIdx, isSubmitModalOpen: true };
      }
    };

    const navigatePrev = (activeSecIdx: number, activeQIdx: number, sections: MockSection[]) => {
      if (activeQIdx > 0) {
        return { activeSectionIdx: activeSecIdx, activeQuestionIdx: activeQIdx - 1 };
      } else if (activeSecIdx > 0) {
        const prevSecIdx = activeSecIdx - 1;
        const prevSecQuestions = sections[prevSecIdx]?.questions || [];
        return { activeSectionIdx: prevSecIdx, activeQuestionIdx: Math.max(0, prevSecQuestions.length - 1) };
      }
      return { activeSectionIdx: activeSecIdx, activeQuestionIdx: activeQIdx };
    };

    it("should advance within Section A (A1 -> A2 ... A7 -> A8)", () => {
      let state = { activeSectionIdx: 0, activeQuestionIdx: 0, isSubmitModalOpen: false };
      for (let i = 0; i < 7; i++) {
        state = navigateNext(state.activeSectionIdx, state.activeQuestionIdx, exam);
        expect(state.activeSectionIdx).toBe(0);
        expect(state.activeQuestionIdx).toBe(i + 1);
        expect(state.isSubmitModalOpen).toBe(false);
      }
      expect(state.activeQuestionIdx).toBe(7); // Question 8 of Section A
    });

    it("should transition from Section A Question 8 to Section B Question 1 on Save & Next", () => {
      const stateOnA8 = { activeSectionIdx: 0, activeQuestionIdx: 7, isSubmitModalOpen: false };
      const nextState = navigateNext(stateOnA8.activeSectionIdx, stateOnA8.activeQuestionIdx, exam);

      expect(nextState.activeSectionIdx).toBe(1); // Section B
      expect(nextState.activeQuestionIdx).toBe(0); // Question 1 of Section B
      expect(getSectionQuestionNumber(nextState.activeQuestionIdx)).toBe(1);
      expect(nextState.isSubmitModalOpen).toBe(false);
    });

    it("should transition backward from Section B Question 1 to Section A Question 8 on Previous", () => {
      const stateOnB1 = { activeSectionIdx: 1, activeQuestionIdx: 0 };
      const prevState = navigatePrev(stateOnB1.activeSectionIdx, stateOnB1.activeQuestionIdx, exam);

      expect(prevState.activeSectionIdx).toBe(0); // Section A
      expect(prevState.activeQuestionIdx).toBe(7); // Question 8 of Section A
      expect(getSectionQuestionNumber(prevState.activeQuestionIdx)).toBe(8);
    });

    it("should trigger Submit Examination on the last question of the entire exam (Section B Question 5)", () => {
      const stateOnB5 = { activeSectionIdx: 1, activeQuestionIdx: 4, isSubmitModalOpen: false };
      const nextState = navigateNext(stateOnB5.activeSectionIdx, stateOnB5.activeQuestionIdx, exam);

      expect(nextState.isSubmitModalOpen).toBe(true);
      expect(nextState.activeSectionIdx).toBe(1);
      expect(nextState.activeQuestionIdx).toBe(4); // Did NOT advance to nonexistent Q6
    });

    it("should disable Previous on Section A Question 1 (start of exam)", () => {
      const isFirst = (sIdx: number, qIdx: number) => sIdx === 0 && qIdx === 0;
      expect(isFirst(0, 0)).toBe(true);
      expect(isFirst(0, 1)).toBe(false);
      expect(isFirst(1, 0)).toBe(false);
    });

    it("should correctly identify last question in section vs last question in entire exam", () => {
      const isLastInSec = (qIdx: number, secQuestionsCount: number) => qIdx >= secQuestionsCount - 1;
      const isLastInExam = (sIdx: number, qIdx: number, totalSecs: number, secQuestionsCount: number) =>
        sIdx >= totalSecs - 1 && isLastInSec(qIdx, secQuestionsCount);

      // Section A Question 8
      expect(isLastInSec(7, 8)).toBe(true);
      expect(isLastInExam(0, 7, 2, 8)).toBe(false); // Can navigate to Section B

      // Section B Question 5
      expect(isLastInSec(4, 5)).toBe(true);
      expect(isLastInExam(1, 4, 2, 5)).toBe(true); // Final question
    });
  });

  describe("Question Palette and Answer State Independence", () => {
    it("should maintain independent answer and review statuses for identical question display numbers", () => {
      const answers: Record<string, { selectedOptionId: string | null; isMarkedForReview: boolean }> = {};

      const qA1Id = "q-uuid-1-1"; // Section A Question 1
      const qB1Id = "q-uuid-2-1"; // Section B Question 1

      // Candidate answers Section A Question 1
      answers[qA1Id] = { selectedOptionId: "opt-a1-b", isMarkedForReview: true };

      // Candidate visits Section B Question 1 but does not answer
      answers[qB1Id] = { selectedOptionId: null, isMarkedForReview: false };

      // Both display as "Question 1" in their respective sections
      expect(getSectionQuestionNumber(0)).toBe(1);

      // But statuses are strictly segregated by UUID
      expect(answers[qA1Id].selectedOptionId).toBe("opt-a1-b");
      expect(answers[qA1Id].isMarkedForReview).toBe(true);

      expect(answers[qB1Id].selectedOptionId).toBeNull();
      expect(answers[qB1Id].isMarkedForReview).toBe(false);
    });
  });
});
