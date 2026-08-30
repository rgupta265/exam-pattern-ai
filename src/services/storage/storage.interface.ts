import { StoredFileRecord, UploadFileOptions } from "@/types/storage.types";

export interface IStorageService {
  /**
   * Save a file buffer to storage and create database file record
   */
  saveFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options: UploadFileOptions
  ): Promise<StoredFileRecord>;

  /**
   * Read file content from storage
   */
  readFile(storagePath: string): Promise<Buffer>;

  /**
   * Delete a file from storage and database
   */
  deleteFile(fileId: string): Promise<boolean>;

  /**
   * Get file metadata from database by ID
   */
  getFileMetadata(fileId: string): Promise<StoredFileRecord | null>;

  /**
   * Get full filesystem path for a private or public file
   */
  resolveFilePath(storagePath: string): string;

  /**
   * Validate file size and mime types
   */
  validateFile(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options?: Partial<UploadFileOptions>
  ): void;
}
