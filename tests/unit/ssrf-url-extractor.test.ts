import { describe, it, expect } from "vitest";
import { UrlContentExtractorService } from "@/services/ai/url-content-extractor.service";
import { BadRequestError } from "@/lib/errors";

describe("UrlContentExtractorService - SSRF & Security Defense", () => {
  it("should identify private IPv4 ranges correctly", () => {
    // Loopback
    expect(UrlContentExtractorService.isPrivateIp("127.0.0.1")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("127.255.255.255")).toBe(true);

    // Private 10.0.0.0/8
    expect(UrlContentExtractorService.isPrivateIp("10.0.0.1")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("10.255.0.1")).toBe(true);

    // Private 172.16.0.0/12
    expect(UrlContentExtractorService.isPrivateIp("172.16.0.1")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("172.31.255.255")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("172.32.0.1")).toBe(false); // Public

    // Private 192.168.0.0/16
    expect(UrlContentExtractorService.isPrivateIp("192.168.1.1")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("192.168.0.254")).toBe(true);

    // Metadata & Link-Local 169.254.0.0/16
    expect(UrlContentExtractorService.isPrivateIp("169.254.169.254")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("169.254.1.1")).toBe(true);

    // Public IPs
    expect(UrlContentExtractorService.isPrivateIp("8.8.8.8")).toBe(false);
    expect(UrlContentExtractorService.isPrivateIp("1.1.1.1")).toBe(false);
    expect(UrlContentExtractorService.isPrivateIp("142.250.190.46")).toBe(false);
  });

  it("should identify private IPv6 ranges correctly", () => {
    expect(UrlContentExtractorService.isPrivateIp("::1")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("fe80::1")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("fc00::1")).toBe(true);
    expect(UrlContentExtractorService.isPrivateIp("::ffff:127.0.0.1")).toBe(true);
  });

  it("should reject forbidden local hostnames and protocols", async () => {
    await expect(UrlContentExtractorService.validateUrlSafety("file:///etc/passwd")).rejects.toThrow(
      BadRequestError
    );

    await expect(UrlContentExtractorService.validateUrlSafety("ftp://example.com/notes.txt")).rejects.toThrow(
      BadRequestError
    );

    await expect(UrlContentExtractorService.validateUrlSafety("http://localhost:3000/notes")).rejects.toThrow(
      BadRequestError
    );

    await expect(UrlContentExtractorService.validateUrlSafety("http://127.0.0.1:8080/admin")).rejects.toThrow(
      BadRequestError
    );

    await expect(UrlContentExtractorService.validateUrlSafety("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(
      BadRequestError
    );
  });
});
