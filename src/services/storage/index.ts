import { LocalStorageProvider } from "./local-storage.provider";
import { IStorageService } from "./storage.interface";

export * from "./storage.interface";
export * from "./local-storage.provider";

export const storageService: IStorageService = new LocalStorageProvider();
