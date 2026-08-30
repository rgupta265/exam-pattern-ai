export const appConfig = {
  name: "ExamPattern AI",
  description: "Notification-driven AI Mock Test Platform",
  version: "1.0.0",
  url: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  env: process.env.NODE_ENV || "development",
  storageBasePath: process.env.STORAGE_PATH || process.env.STORAGE_BASE_PATH || "./storage",
  isProduction: process.env.NODE_ENV === "production",
};
