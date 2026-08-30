import { describe, it, expect } from "vitest";
import { DocumentContentExtractor } from "@/services/ai/document-content-extractor.service";

describe("DocumentContentExtractor Unit Tests", () => {
  it("should extract and sanitize raw text input correctly", async () => {
    const rawInput = "This is a detailed textbook chapter on human anatomy and circulatory system.";
    const result = await DocumentContentExtractor.extract({ text: rawInput });

    expect(result.sourceType).toBe("TEXT");
    expect(result.text).toBe(rawInput);
    expect(result.wordCount).toBeGreaterThan(5);
    expect(result.preview).toContain("human anatomy");
  });

  it("should reject raw text that is too short", async () => {
    await expect(
      DocumentContentExtractor.extract({ text: "Short" })
    ).rejects.toThrow("Source text is too short");
  });

  it("should extract text from a simulated PDF buffer", async () => {
    const fakePdfBuffer = Buffer.from(
      "%PDF-1.4 (Vaccination schedules and cold chain preservation) Tj ET"
    );
    const result = await DocumentContentExtractor.extract({
      buffer: fakePdfBuffer,
      fileName: "vaccines.pdf",
      mimeType: "application/pdf",
    });

    expect(result.sourceType).toBe("PDF");
    expect(result.text).toContain("Vaccination schedules");
  });

  it("should extract text from a simulated DOCX buffer", async () => {
    const fakeDocxBuffer = Buffer.from(
      "<w:p><w:r><w:t>Epidemiology surveillance in rural healthcare subcenters.</w:t></w:r></w:p>"
    );
    const result = await DocumentContentExtractor.extract({
      buffer: fakeDocxBuffer,
      fileName: "epidemiology.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    expect(result.sourceType).toBe("DOCX");
    expect(result.text).toContain("Epidemiology surveillance");
  });

  it("should process image OCR simulation", async () => {
    const fakeImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG Magic Bytes
    const result = await DocumentContentExtractor.extract({
      buffer: fakeImageBuffer,
      fileName: "medical_chart.png",
      mimeType: "image/png",
    });

    expect(result.sourceType).toBe("IMAGE");
    expect(result.text).toContain("Extracted OCR text");
  });
});
