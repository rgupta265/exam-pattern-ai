import { geminiProvider, GeminiProvider } from "./gemini.provider";
import { DocumentAnalysisResult, DocumentAnalysisResultSchema } from "@/modules/ai/schemas/ai-extraction.schema";
import { ValidationError } from "@/lib/errors";

export class GeminiDocumentService {
  private readonly provider: GeminiProvider;

  constructor(provider?: GeminiProvider) {
    this.provider = provider || geminiProvider;
  }

  /**
   * Analyze official document text and extract structured exam blueprint and syllabus
   */
  public async analyzeOfficialDocument(params: {
    documentTitle: string;
    documentType: string;
    rawTextContent: string;
    knownExamName?: string;
    knownYear?: number;
  }): Promise<DocumentAnalysisResult> {
    const prompt = `You are a Senior Exam Architect and Examination Blueprint Analyst for ExamPattern AI.
Analyze the following official exam document and extract structured exam information.

Document Title: ${params.documentTitle}
Document Type: ${params.documentType}
Known Exam Context: ${params.knownExamName || "Unknown"} (${params.knownYear || "Current Year"})

Official Document Content:
"""
${params.rawTextContent.slice(0, 50000)}
"""

You MUST respond strictly with valid JSON conforming to the following structure:
{
  "examInfo": {
    "examName": "string",
    "authority": "string",
    "postName": "string",
    "year": number,
    "notificationNumber": "string | null"
  },
  "pattern": {
    "title": "string",
    "totalQuestions": number,
    "totalMarks": number,
    "durationMinutes": number,
    "hasNegativeMarking": boolean,
    "negativeMarkingRate": number,
    "questionTypes": ["SINGLE_CHOICE"],
    "languages": ["English", "Hindi"],
    "instructions": "string",
    "sourceTraceability": {
      "documentName": "${params.documentTitle}",
      "pageNumber": 1,
      "excerpt": "string",
      "isAmbiguous": boolean,
      "confidenceScore": 0.95
    }
  },
  "sections": [
    {
      "name": "string",
      "sectionOrder": 1,
      "questionCount": number,
      "marksPerQuestion": number,
      "totalMarks": number,
      "negativeRate": number,
      "instructions": "string",
      "sourceTraceability": { "documentName": "${params.documentTitle}", "pageNumber": 1, "excerpt": "string", "confidenceScore": 0.95 }
    }
  ],
  "rules": [
    {
      "ruleType": "DIFFICULTY_RATIO",
      "ruleConfig": { "easy": 30, "medium": 50, "hard": 20 },
      "description": "string"
    }
  ],
  "syllabus": [
    {
      "name": "string",
      "code": "string",
      "description": "string",
      "sortOrder": 1,
      "topics": [
        {
          "name": "string",
          "code": "string",
          "description": "string",
          "weightagePercentage": number,
          "sortOrder": 1,
          "subtopics": ["string"]
        }
      ]
    }
  ],
  "summaryNotes": "string",
  "uncertainties": ["string"]
}

Important Rules:
1. SUM of (section.questionCount) MUST EQUAL pattern.totalQuestions.
2. SUM of (section.totalMarks) MUST EQUAL pattern.totalMarks.
3. For each section, questionCount * marksPerQuestion MUST EQUAL totalMarks.
4. If negative marking exists, record the deduction fraction (e.g. 0.25 for 1/4th, 0.33 for 1/3rd).
5. Never invent or hallucinate syllabus topics outside the document.
6. Return only pure JSON without markdown code fences.`;

    const rawResponse = await this.provider.generateContent(prompt, {
      responseMimeType: "application/json",
      temperature: 0.05,
    });

    try {
      // Clean potential code fences if returned
      const cleanJson = rawResponse
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      return DocumentAnalysisResultSchema.parse(parsed);
    } catch (err) {
      console.error("[GeminiDocumentService] Failed to parse/validate Gemini response:", err);
      throw new ValidationError("Gemini returned invalid or non-compliant structured exam data", err);
    }
  }
}

export const geminiDocumentService = new GeminiDocumentService();
