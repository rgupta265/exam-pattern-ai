import dns from "dns/promises";
import crypto from "crypto";
import { BadRequestError } from "@/lib/errors";

export interface ExtractedUrlContent {
  url: string;
  hostname: string;
  title: string;
  text: string;
  contentHash: string;
  wordCount: number;
  preview: string;
  fetchedAt: Date;
}

export class UrlContentExtractorService {
  private static readonly TIMEOUT_MS = 6000;
  private static readonly MAX_BYTES = 2 * 1024 * 1024; // 2 MB
  private static readonly MAX_REDIRECTS = 3;

  /**
   * Checks if an IP address string belongs to a private/loopback/internal range (IPv4 or IPv6)
   */
  public static isPrivateIp(ip: string): boolean {
    // Clean IPv6 IPv4-mapped notation like ::ffff:127.0.0.1
    if (ip.startsWith("::ffff:")) {
      const v4 = ip.replace("::ffff:", "");
      return this.isPrivateIp(v4);
    }

    // IPv6 checks
    if (ip.includes(":")) {
      const lower = ip.toLowerCase();
      // Loopback
      if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
      // Link-local fe80::/10
      if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
      // Unique Local Addresses fc00::/7 (fc00:: - fdff::)
      if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
      // Unspecified ::
      if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
      return false;
    }

    // IPv4 checks
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true; // Invalid format treated as unsafe
    }

    const [a, b] = parts;

    // 0.0.0.0/8
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local & AWS/GCP metadata)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    return false;
  }

  /**
   * Validates URL format and verifies DNS resolution does not resolve to private addresses
   */
  public static async validateUrlSafety(inputUrl: string): Promise<{ url: URL; resolvedIp: string }> {
    let parsed: URL;
    try {
      parsed = new URL(inputUrl);
    } catch {
      throw new BadRequestError("Invalid URL format. Please provide a valid HTTP or HTTPS URL.");
    }

    // Protocol check
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new BadRequestError(`Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block known loopback and internal hostname strings
    const blockedHostnames = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "[::1]",
      "::1",
      "metadata.google.internal",
      "instance-data",
      "169.254.169.254",
    ];

    if (blockedHostnames.includes(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      throw new BadRequestError("Access to local or private network hostnames is prohibited.");
    }

    // If hostname is directly an IP literal
    if (this.isPrivateIp(hostname)) {
      throw new BadRequestError("Access to internal/private IP addresses is strictly prohibited.");
    }

    // Resolve DNS safely
    try {
      const lookupResult = await dns.lookup(hostname, { all: true });
      if (!lookupResult || lookupResult.length === 0) {
        throw new BadRequestError(`Could not resolve hostname "${hostname}".`);
      }

      for (const entry of lookupResult) {
        if (this.isPrivateIp(entry.address)) {
          throw new BadRequestError(`Host "${hostname}" resolved to a forbidden private/internal IP address (${entry.address}).`);
        }
      }

      return { url: parsed, resolvedIp: lookupResult[0].address };
    } catch (err: unknown) {
      if (err instanceof BadRequestError) throw err;
      throw new BadRequestError(`DNS resolution failed for hostname "${hostname}".`);
    }
  }

  /**
   * Safely fetches and extracts readable text from an authorized public URL with SSRF protection
   */
  public static async extractFromUrl(inputUrl: string): Promise<ExtractedUrlContent> {
    let currentUrl = inputUrl;
    let redirectCount = 0;
    let finalHtml = "";
    let finalUrl = inputUrl;

    while (redirectCount <= this.MAX_REDIRECTS) {
      const { url } = await this.validateUrlSafety(currentUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          redirect: "manual", // Handle redirects manually to validate destination IPs!
          headers: {
            "User-Agent": "ExamPatternAI-ContentBot/1.0 (+https://exampattern.ai)",
            Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          },
        });

        // Check for redirects
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (!location) {
            throw new BadRequestError("Redirect missing Location header.");
          }

          redirectCount++;
          if (redirectCount > this.MAX_REDIRECTS) {
            throw new BadRequestError("Too many redirects (exceeded limit of 3).");
          }

          // Resolve relative redirect against current URL
          const nextUrl = new URL(location, url.toString()).toString();
          currentUrl = nextUrl;
          continue;
        }

        if (!response.ok) {
          throw new BadRequestError(`Failed to fetch URL. Remote server returned HTTP ${response.status} ${response.statusText}.`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (
          !contentType.includes("text/html") &&
          !contentType.includes("text/plain") &&
          !contentType.includes("application/xhtml") &&
          !contentType.includes("text/markdown")
        ) {
          throw new BadRequestError(`Unsupported Content-Type "${contentType}". Only web pages and text documents are allowed.`);
        }

        // Read response body with byte cap
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > this.MAX_BYTES) {
          throw new BadRequestError(`Response size (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size of 2 MB.`);
        }

        const decoder = new TextDecoder("utf-8");
        finalHtml = decoder.decode(buffer);
        finalUrl = url.toString();
        break;
      } catch (err: unknown) {
        if (err instanceof BadRequestError) throw err;
        if (err instanceof Error && err.name === "AbortError") {
          throw new BadRequestError("Request timed out while fetching URL (limit 6 seconds).");
        }
        throw new BadRequestError(`Failed to retrieve URL content: ${err instanceof Error ? err.message : "Network error"}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // Clean and extract readable text from HTML
    const { title, text } = this.extractReadableTextFromHtml(finalHtml, finalUrl);

    if (!text || text.trim().length < 20) {
      throw new BadRequestError("The fetched page does not contain sufficient readable text for practice question generation.");
    }

    const contentHash = crypto.createHash("sha256").update(text).digest("hex");
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const preview = text.slice(0, 300) + (text.length > 300 ? "..." : "");

    return {
      url: finalUrl,
      hostname: new URL(finalUrl).hostname,
      title: title || new URL(finalUrl).hostname,
      text,
      contentHash,
      wordCount,
      preview,
      fetchedAt: new Date(),
    };
  }

  /**
   * Simple and safe HTML to readable text stripper without external heavy dependencies
   */
  private static extractReadableTextFromHtml(html: string, fallbackUrl: string): { title: string; text: string } {
    // 1. Extract Title
    let title = "";
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      title = new URL(fallbackUrl).hostname;
    }

    // 2. Remove script, style, noscript, svg, header, footer, nav, aside, form tags and contents
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ")
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, " ");

    // 3. Convert line breaks and paragraph ends
    clean = clean
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|article|section)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n");

    // 4. Strip remaining HTML tags
    clean = clean.replace(/<[^>]+>/g, " ");

    // 5. Decode common HTML entities
    clean = clean
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–");

    // 6. Normalize whitespace and empty lines
    const normalizedLines = clean
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 0);

    const finalText = normalizedLines.join("\n\n").trim();

    return { title, text: finalText };
  }
}
