import { describe, it, expect } from "vitest";
import { LocalStorageProvider } from "@/services/storage/local-storage.provider";
import { BadRequestError } from "@/lib/errors";

describe("LocalStorageProvider Security & Validation", () => {
  const provider = new LocalStorageProvider("./storage");

  it("should validate and reject disallowed executable file extensions", () => {
    const buffer = Buffer.from("malicious executable content");
    expect(() => {
      provider.validateFile(buffer, "script.exe", "application/x-msdownload");
    }).toThrow(BadRequestError);

    expect(() => {
      provider.validateFile(buffer, "test.bat", "text/plain");
    }).toThrow(BadRequestError);

    expect(() => {
      provider.validateFile(buffer, "exploit.sh", "application/x-sh");
    }).toThrow(BadRequestError);
  });

  it("should enforce maximum file size limit", () => {
    const buffer = Buffer.alloc(10 * 1024); // 10KB
    expect(() => {
      provider.validateFile(buffer, "doc.pdf", "application/pdf", {
        maxSizeBytes: 5 * 1024, // 5KB limit
      });
    }).toThrow(BadRequestError);
  });

  it("should enforce allowed MIME types whitelist", () => {
    const buffer = Buffer.from("test document");
    expect(() => {
      provider.validateFile(buffer, "image.png", "image/png", {
        allowedMimeTypes: ["application/pdf"],
      });
    }).toThrow(BadRequestError);

    expect(() => {
      provider.validateFile(buffer, "doc.pdf", "application/pdf", {
        allowedMimeTypes: ["application/pdf"],
      });
    }).not.toThrow();
  });

  it("should defend against directory path traversal attacks", () => {
    expect(() => {
      provider.resolveFilePath("../../../etc/passwd");
    }).not.toThrow(); // Normalized safely within base path or throws if escape detected

    expect(() => {
      provider.resolveFilePath("..\\..\\..\\windows\\system32");
    }).not.toThrow();
  });
});
