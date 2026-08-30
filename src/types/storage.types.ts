export type StorageFolder =
  | "notifications"
  | "question-assets"
  | "exports"
  | "candidate-documents"
  | "avatars";

export type StorageVisibility = "PRIVATE" | "PUBLIC";

export interface StoredFileRecord {
  id: string;
  originalName: string;
  storedName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  checksumSha256: string;
  visibility: StorageVisibility;
  folderCategory: StorageFolder;
  createdAt: Date;
}

export interface UploadFileOptions {
  folder: StorageFolder;
  visibility?: StorageVisibility;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}
