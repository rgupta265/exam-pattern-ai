import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";
import { appConfig } from "@/config/app.config";
import { prisma } from "@/lib/prisma";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { StorageFolder, StoredFileRecord, UploadFileOptions } from "@/types/storage.types";
import { IStorageService } from "./storage.interface";

export class LocalStorageProvider implements IStorageService {
  private readonly basePath: string;

  constructor(basePath?: string) {
    this.basePath = path.resolve(basePath || appConfig.storageBasePath);
    this.ensureDirectoryStructure();
  }

  private ensureDirectoryStructure(): void {
    const folders: StorageFolder[] = [
      "notifications",
      "question-assets",
      "exports",
      "candidate-documents",
      "avatars",
    ];

    const storageRoot = path.resolve(process.cwd(), "storage");

    for (const folder of folders) {
      const isPublic = folder === "avatars";
      const dirPath = path.resolve(storageRoot, isPublic ? "public" : "private", folder);
      if (!fsSync.existsSync(dirPath)) {
        fsSync.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  public validateFile(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options?: Partial<UploadFileOptions>
  ): void {
    // 1. Check size limit (default 25MB)
    const maxSize = options?.maxSizeBytes || 25 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new BadRequestError(`File size exceeds maximum limit of ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
    }

    // 2. Validate MIME type if whitelist specified
    if (options?.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(mimeType)) {
        throw new BadRequestError(`Invalid MIME type '${mimeType}'. Allowed: ${options.allowedMimeTypes.join(", ")}`);
      }
    }

    // 3. Filename safety & extension validation
    const ext = path.extname(originalFileName).toLowerCase();
    const disallowedExtensions = [".exe", ".bat", ".sh", ".cmd", ".vbs", ".js", ".mjs", ".msi", ".dll", ".php", ".py"];
    if (disallowedExtensions.includes(ext)) {
      throw new BadRequestError(`File extension '${ext}' is disallowed for security reasons`);
    }
  }

  public async saveFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options: UploadFileOptions
  ): Promise<StoredFileRecord> {
    this.validateFile(fileBuffer, originalFileName, mimeType, options);

    const isPublic = options.folder === "avatars" || options.visibility === "PUBLIC";
    const visibility = isPublic ? "PUBLIC" : "PRIVATE";
    const subFolder = isPublic ? "public" : "private";

    // Compute SHA-256 checksum
    const checksumSha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Generate sanitized randomized filename
    const ext = path.extname(originalFileName).toLowerCase();
    const randomId = crypto.randomBytes(16).toString("hex");
    const storedName = `${Date.now()}_${randomId}${ext}`;

    // Target relative path
    const relativePath = path.posix.join(subFolder, options.folder, storedName);
    const absolutePath = path.join(this.basePath, subFolder, options.folder, storedName);

    // Write file to filesystem
    await fs.writeFile(absolutePath, fileBuffer);

    // Save record to DB
    const fileRecord = await prisma.file.create({
      data: {
        originalName: originalFileName,
        storedName,
        storagePath: relativePath,
        mimeType,
        fileSize: BigInt(fileBuffer.length),
        checksumSha256,
        visibility,
        folderCategory: options.folder,
      },
    });

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      storedName: fileRecord.storedName,
      storagePath: fileRecord.storagePath,
      mimeType: fileRecord.mimeType,
      fileSize: Number(fileRecord.fileSize),
      checksumSha256: fileRecord.checksumSha256,
      visibility: fileRecord.visibility as "PRIVATE" | "PUBLIC",
      folderCategory: fileRecord.folderCategory as StorageFolder,
      createdAt: fileRecord.createdAt,
    };
  }

  public resolveFilePath(storagePath: string): string {
    const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const absolutePath = path.join(this.basePath, normalized);

    // Path traversal defense
    if (!absolutePath.startsWith(this.basePath)) {
      throw new BadRequestError("Access denied: Invalid file path traversal detected");
    }

    return absolutePath;
  }

  public async readFile(storagePath: string): Promise<Buffer> {
    const fullPath = this.resolveFilePath(storagePath);
    try {
      return await fs.readFile(fullPath);
    } catch {
      throw new NotFoundError("File not found on filesystem");
    }
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) return false;

    const fullPath = this.resolveFilePath(fileRecord.storagePath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist on disk
    }

    await prisma.file.delete({
      where: { id: fileId },
    });

    return true;
  }

  public async getFileMetadata(fileId: string): Promise<StoredFileRecord | null> {
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) return null;

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      storedName: fileRecord.storedName,
      storagePath: fileRecord.storagePath,
      mimeType: fileRecord.mimeType,
      fileSize: Number(fileRecord.fileSize),
      checksumSha256: fileRecord.checksumSha256,
      visibility: fileRecord.visibility as "PRIVATE" | "PUBLIC",
      folderCategory: fileRecord.folderCategory as StorageFolder,
      createdAt: fileRecord.createdAt,
    };
  }
}
