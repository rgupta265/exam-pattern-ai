export type EmailProviderType = "console" | "smtp" | "resend";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  locale?: string;
}

export interface EmailTemplateData {
  appName: string;
  recipientName?: string;
  otp: string;
  expiresInMinutes: number;
  locale: "en" | "hi";
}
