import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";

export class ScoreCalculationService {
  /**
   * Evaluates all candidate answers and persists immutable test results transactionally
   */
  public static async calculateAndPersistResult(attemptId: string) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          include: {
            sections: {
              orderBy: { sectionOrder: "asc" },
              include: {
                questions: {
                  orderBy: { questionOrder: "asc" },
                  include: {
                    question: {
                      include: {
                        options: { orderBy: { sortOrder: "asc" } },
                        topic: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        answers: {
          include: {
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Test Attempt");
    }

    // Check if result already exists (idempotency)
    const existingResult = await prisma.testResult.findUnique({
      where: { attemptId },
      include: {
        sectionResults: true,
        topicResults: true,
        questionResults: true,
      },
    });

    if (existingResult) {
      return existingResult;
    }

    const mock = attempt.mockTest;
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;
    let unattemptedCount = 0;
    let rawScore = 0;
    let penaltyDeduction = 0;

    const sectionStatsMap = new Map<
      string,
      {
        sectionName: string;
        totalQuestions: number;
        totalMarks: number;
        attempted: number;
        correct: number;
        incorrect: number;
        score: number;
        timeSpentSeconds: number;
      }
    >();

    const topicStatsMap = new Map<
      string,
      {
        topicId: string;
        topicName: string;
        totalQuestions: number;
        attempted: number;
        correct: number;
        incorrect: number;
        timeSpentSeconds: number;
      }
    >();

    const questionResultsData: {
      questionId: string;
      selectedOptionId: string | null;
      selectedOptionKey: string | null;
      correctOptionKey: string | null;
      isAttempted: boolean;
      isCorrect: boolean;
      isMarkedForReview: boolean;
      marksAwarded: number;
      timeSpentSeconds: number;
    }[] = [];

    // Evaluate each section and question
    for (const sec of mock.sections) {
      let secAttempted = 0;
      let secCorrect = 0;
      let secIncorrect = 0;
      let secScore = 0;
      let secTimeSpent = 0;
      const secTotalMarks = Number(sec.marksPerQuestion) * sec.questions.length;

      for (const mq of sec.questions) {
        const q = mq.question;
        const ans = answerMap.get(q.id);
        const correctOpt = q.options.find((o) => o.isCorrect) || q.options[0];
        const correctKey = correctOpt?.optionKey || "A";

        const topicId = q.topic.id;
        const topicName = q.topic.name;

        if (!topicStatsMap.has(topicId)) {
          topicStatsMap.set(topicId, {
            topicId,
            topicName,
            totalQuestions: 0,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            timeSpentSeconds: 0,
          });
        }
        const topicStat = topicStatsMap.get(topicId)!;
        topicStat.totalQuestions++;

        const isAnswered = Boolean(ans && (ans.selectedOptionId || ans.isAnswered));
        const timeSpent = ans?.timeSpentSeconds || 0;
        secTimeSpent += timeSpent;
        topicStat.timeSpentSeconds += timeSpent;

        if (isAnswered && ans?.selectedOptionId) {
          attemptedCount++;
          secAttempted++;
          topicStat.attempted++;

          const isCorrect = ans.selectedOptionId === correctOpt?.id;

          if (isCorrect) {
            correctCount++;
            secCorrect++;
            topicStat.correct++;
            const marks = Number(mq.marks);
            rawScore += marks;
            secScore += marks;

            questionResultsData.push({
              questionId: q.id,
              selectedOptionId: ans.selectedOptionId,
              selectedOptionKey: ans.selectedOption?.optionKey || null,
              correctOptionKey: correctKey,
              isAttempted: true,
              isCorrect: true,
              isMarkedForReview: ans.isMarkedForReview,
              marksAwarded: marks,
              timeSpentSeconds: timeSpent,
            });
          } else {
            incorrectCount++;
            secIncorrect++;
            topicStat.incorrect++;
            const penalty = Number(mq.negativeMarks);
            penaltyDeduction += penalty;
            secScore -= penalty;

            questionResultsData.push({
              questionId: q.id,
              selectedOptionId: ans.selectedOptionId,
              selectedOptionKey: ans.selectedOption?.optionKey || null,
              correctOptionKey: correctKey,
              isAttempted: true,
              isCorrect: false,
              isMarkedForReview: ans.isMarkedForReview,
              marksAwarded: -penalty,
              timeSpentSeconds: timeSpent,
            });
          }
        } else {
          unattemptedCount++;

          questionResultsData.push({
            questionId: q.id,
            selectedOptionId: null,
            selectedOptionKey: null,
            correctOptionKey: correctKey,
            isAttempted: false,
            isCorrect: false,
            isMarkedForReview: ans?.isMarkedForReview || false,
            marksAwarded: 0,
            timeSpentSeconds: timeSpent,
          });
        }
      }

      sectionStatsMap.set(sec.id, {
        sectionName: sec.name,
        totalQuestions: sec.questions.length,
        totalMarks: secTotalMarks,
        attempted: secAttempted,
        correct: secCorrect,
        incorrect: secIncorrect,
        score: Math.max(0, secScore),
        timeSpentSeconds: secTimeSpent,
      });
    }

    const netScore = Math.max(0, rawScore - penaltyDeduction);
    const totalMarks = Number(mock.totalMarks);
    const percentage = totalMarks > 0 ? Math.min(100, Math.max(0, (netScore / totalMarks) * 100)) : 0;
    const accuracyRate = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    // Persist result and detailed breakdowns transactionally
    const result = await prisma.$transaction(async (tx) => {
      const createdResult = await tx.testResult.create({
        data: {
          attemptId,
          totalQuestions: mock.totalQuestions,
          attemptedQuestions: attemptedCount,
          correctAnswers: correctCount,
          incorrectAnswers: incorrectCount,
          unattemptedQuestions: unattemptedCount,
          rawScore: new Prisma.Decimal(rawScore),
          penaltyDeduction: new Prisma.Decimal(penaltyDeduction),
          netScore: new Prisma.Decimal(netScore),
          totalMarks: mock.totalMarks,
          percentage: new Prisma.Decimal(percentage),
          accuracyRate: new Prisma.Decimal(accuracyRate),
          sectionResults: {
            create: Array.from(sectionStatsMap.entries()).map(([secId, stat]) => ({
              mockSectionId: secId,
              sectionName: stat.sectionName,
              totalQuestions: stat.totalQuestions,
              attempted: stat.attempted,
              correct: stat.correct,
              incorrect: stat.incorrect,
              score: new Prisma.Decimal(stat.score),
              totalMarks: new Prisma.Decimal(stat.totalMarks),
              accuracy: new Prisma.Decimal(
                stat.attempted > 0 ? (stat.correct / stat.attempted) * 100 : 0
              ),
              timeSpentSeconds: stat.timeSpentSeconds,
            })),
          },
          topicResults: {
            create: Array.from(topicStatsMap.values()).map((tStat) => ({
              topicId: tStat.topicId,
              topicName: tStat.topicName,
              totalQuestions: tStat.totalQuestions,
              attempted: tStat.attempted,
              correct: tStat.correct,
              incorrect: tStat.incorrect,
              accuracy: new Prisma.Decimal(
                tStat.attempted > 0 ? (tStat.correct / tStat.attempted) * 100 : 0
              ),
              timeSpentSeconds: tStat.timeSpentSeconds,
            })),
          },
          questionResults: {
            create: questionResultsData.map((qr) => ({
              questionId: qr.questionId,
              selectedOptionId: qr.selectedOptionId,
              selectedOptionKey: qr.selectedOptionKey,
              correctOptionKey: qr.correctOptionKey,
              isAttempted: qr.isAttempted,
              isCorrect: qr.isCorrect,
              isMarkedForReview: qr.isMarkedForReview,
              marksAwarded: new Prisma.Decimal(qr.marksAwarded),
              timeSpentSeconds: qr.timeSpentSeconds,
            })),
          },
        },
        include: {
          sectionResults: true,
          topicResults: true,
          questionResults: true,
        },
      });

      // Update Candidate Exam Statistics
      const existingExamStat = await tx.candidateExamStatistic.findUnique({
        where: {
          candidateId_examVersionId: {
            candidateId: attempt.candidateId,
            examVersionId: mock.examVersionId,
          },
        },
      });

      if (existingExamStat) {
        const newCount = existingExamStat.attemptsCount + 1;
        const newBest = Math.max(Number(existingExamStat.bestScore), netScore);
        const newAvgScore =
          (Number(existingExamStat.averageScore) * existingExamStat.attemptsCount + netScore) /
          newCount;
        const newAvgAcc =
          (Number(existingExamStat.averageAccuracy) * existingExamStat.attemptsCount +
            accuracyRate) /
          newCount;

        await tx.candidateExamStatistic.update({
          where: { id: existingExamStat.id },
          data: {
            attemptsCount: newCount,
            bestScore: new Prisma.Decimal(newBest),
            averageScore: new Prisma.Decimal(newAvgScore),
            averageAccuracy: new Prisma.Decimal(newAvgAcc),
          },
        });
      } else {
        await tx.candidateExamStatistic.create({
          data: {
            candidateId: attempt.candidateId,
            examVersionId: mock.examVersionId,
            attemptsCount: 1,
            bestScore: new Prisma.Decimal(netScore),
            averageScore: new Prisma.Decimal(netScore),
            averageAccuracy: new Prisma.Decimal(accuracyRate),
          },
        });
      }

      // Update Candidate Topic Statistics
      for (const tStat of topicStatsMap.values()) {
        const existingTopicStat = await tx.candidateTopicStatistic.findUnique({
          where: {
            candidateId_topicId: {
              candidateId: attempt.candidateId,
              topicId: tStat.topicId,
            },
          },
        });

        const newSeen = (existingTopicStat?.questionsSeen || 0) + tStat.totalQuestions;
        const newCorrect = (existingTopicStat?.questionsCorrect || 0) + tStat.correct;
        const newAcc = newSeen > 0 ? (newCorrect / newSeen) * 100 : 0;

        if (existingTopicStat) {
          await tx.candidateTopicStatistic.update({
            where: { id: existingTopicStat.id },
            data: {
              questionsSeen: newSeen,
              questionsCorrect: newCorrect,
              accuracyRate: new Prisma.Decimal(newAcc),
              isWeakTopic: newAcc < 50 && newSeen >= 5,
              isStrongTopic: newAcc >= 75 && newSeen >= 5,
            },
          });
        } else {
          await tx.candidateTopicStatistic.create({
            data: {
              candidateId: attempt.candidateId,
              topicId: tStat.topicId,
              questionsSeen: newSeen,
              questionsCorrect: newCorrect,
              accuracyRate: new Prisma.Decimal(newAcc),
              isWeakTopic: newAcc < 50 && newSeen >= 5,
              isStrongTopic: newAcc >= 75 && newSeen >= 5,
            },
          });
        }
      }

      return createdResult;
    });

    return result;
  }
}
