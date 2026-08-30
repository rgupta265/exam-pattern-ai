import fs from "fs";
import path from "path";

function extractAllKeyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  let paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      paths = paths.concat(extractAllKeyPaths(value as Record<string, unknown>, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  return paths.sort();
}

function getValueByPath(obj: Record<string, unknown>, pathStr: string): unknown {
  const keys = pathStr.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return current;
}

function main() {
  const messagesDir = path.resolve(process.cwd(), "messages");
  const enPath = path.join(messagesDir, "en.json");
  const hiPath = path.join(messagesDir, "hi.json");

  if (!fs.existsSync(enPath) || !fs.existsSync(hiPath)) {
    console.error("❌ Translation files missing in messages/ directory.");
    process.exit(1);
  }

  const enMessages = JSON.parse(fs.readFileSync(enPath, "utf-8"));
  const hiMessages = JSON.parse(fs.readFileSync(hiPath, "utf-8"));

  const enKeys = extractAllKeyPaths(enMessages);
  const hiKeys = extractAllKeyPaths(hiMessages);

  const missingInHindi = enKeys.filter((key) => !hiKeys.includes(key));
  const missingInEnglish = hiKeys.filter((key) => !enKeys.includes(key));

  let hasError = false;

  if (missingInHindi.length > 0) {
    console.error(`❌ Keys in en.json missing in hi.json (${missingInHindi.length}):\n`, missingInHindi);
    hasError = true;
  }

  if (missingInEnglish.length > 0) {
    console.error(`❌ Keys in hi.json missing in en.json (${missingInEnglish.length}):\n`, missingInEnglish);
    hasError = true;
  }

  for (const key of enKeys) {
    const enVal = getValueByPath(enMessages, key);
    const hiVal = getValueByPath(hiMessages, key);

    if (typeof enVal !== "string" || !enVal.trim()) {
      console.error(`❌ Empty or non-string translation in en.json for key: ${key}`);
      hasError = true;
    }
    if (typeof hiVal !== "string" || !hiVal.trim()) {
      console.error(`❌ Empty or non-string translation in hi.json for key: ${key}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error("❌ Translation parity check FAILED.");
    process.exit(1);
  }

  console.log(`✅ Translation parity check PASSED: ${enKeys.length} matching keys validated with 100% parity across English and Hindi.`);
}

main();
