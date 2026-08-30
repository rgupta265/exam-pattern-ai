import { AttemptService } from "../src/services/attempt/attempt.service";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function testExamStartFlow() {
  console.log("🔍 Testing full Candidate Exam Start flow...");

  // 1. Find or create a verified Candidate
  const candidateEmail = "test_candidate_phase17@exampattern.ai";
  let candidate = await prisma.user.findUnique({ where: { email: candidateEmail } });

  if (!candidate) {
    const candidateRole = await prisma.role.findUnique({ where: { code: "CANDIDATE" } });
    const passwordHash = await bcrypt.hash("Candidate@12345", 10);
    candidate = await prisma.user.create({
      data: {
        email: candidateEmail,
        fullName: "Test Candidate Phase 17",
        passwordHash,
        userRoles: {
          create: {
            roleId: candidateRole!.id,
          },
        },
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
      },
    });
    console.log("  Created test candidate:", candidate.id);
  }

  // 2. Fetch a published Mock Test
  const mock = await prisma.mockTest.findFirst({
    where: { status: "PUBLISHED", deletedAt: null },
    include: { sections: { include: { questions: true } } },
  });

  if (!mock) {
    console.error("❌ No published mock test found!");
    return;
  }
  console.log(`  Found published mock: ${mock.title} (ID: ${mock.id}, Code: ${mock.code})`);
  console.log(`  Sections count: ${mock.sections.length}, Total questions: ${mock.totalQuestions}`);

  // 3. Step 1: Create Attempt (via AttemptService.createAttempt)
  console.log("\n🚀 Step 1: Creating attempt for candidate...");
  try {
    const attempt = await AttemptService.createAttempt(mock.id, candidate.id);
    console.log(`  ✅ Attempt created successfully: ID = ${attempt.id}, Status = ${attempt.status}`);

    // 4. Step 2: Acknowledge instructions
    console.log("\n🚀 Step 2: Acknowledging instructions...");
    const ack = await AttemptService.acknowledgeInstructions(attempt.id, candidate.id, "BILINGUAL");
    console.log(`  ✅ Instructions acknowledged: ${ack.instructionsAcknowledgedAt}`);

    // 5. Step 3: Fetch attempt for Exam Room (via AttemptService.getAttemptForExam)
    console.log("\n🚀 Step 3: Fetching attempt for live exam room...");
    const examData = await AttemptService.getAttemptForExam(attempt.id, candidate.id);
    console.log(`  ✅ Exam Room data fetched successfully!`);
    console.log(`     Mock Title: ${examData.mockTest.title}`);
    console.log(`     Sections: ${examData.mockTest.sections.length}`);
    console.log(`     Remaining Seconds: ${examData.remainingSeconds}`);
    console.log(`     Total Questions loaded: ${examData.mockTest.sections.reduce((acc, s) => acc + s.questions.length, 0)}`);
    console.log(`     First question options count: ${examData.mockTest.sections[0]?.questions[0]?.question.options.length}`);
  } catch (err: any) {
    console.error("❌ ERROR during exam start flow:", err.message || err);
    if (err.stack) console.error(err.stack);
  }
}

testExamStartFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
