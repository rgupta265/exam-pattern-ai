import nodemailer from "nodemailer";
import { SendEmailOptions, EmailProviderType } from "./email.types";

export class EmailService {
  private static provider: EmailProviderType = (process.env.EMAIL_PROVIDER as EmailProviderType) || "smtp";
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initializes and returns the Nodemailer SMTP transporter singleton
   */
  private static getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT) || 587;
    const secure = process.env.EMAIL_SECURE === "true" || port === 465;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!host || !user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return this.transporter;
  }

  /**
   * Dispatches an email through the configured provider
   */
  public static async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@exampattern.ai";
    const fromName = process.env.EMAIL_FROM_NAME || "ExamPattern AI";
    const fromHeader = `"${fromName}" <${fromAddress}>`;

    const transporter = this.getTransporter();

    // If SMTP is configured, dispatch via Nodemailer
    if (this.provider === "smtp" && transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromHeader,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        const maskedTo = options.to.replace(/^(.)(.*)(@.*)$/, (_, a, _b, c) => `${a}***${c}`);
        console.log(`✅ 📨 [EmailService:SMTP] Email delivered to ${maskedTo} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`⚠️ [EmailService:SMTP] Failed to send email via SMTP (${options.to}): ${errorMessage}`);
        // In local development / test mode fallback to console output so OTP is visible
        if (process.env.NODE_ENV !== "production") {
          console.log(`\n📨 [EmailService:Console Fallback] Outputting OTP to server console because SMTP failed:`);
          console.log(`   To: ${options.to}`);
          console.log(`   Subject: ${options.subject}`);
          console.log(`   Preview:\n${options.text || options.html}\n`);
          return { success: true, messageId: `console-${Date.now()}` };
        }
        throw new Error(`Email delivery failed: ${errorMessage}`);
      }
    }

    // Console Provider
    const maskedTo = options.to.replace(/^(.)(.*)(@.*)$/, (_, a, _b, c) => `${a}***${c}`);
    console.log(`\n📨 [EmailService:Console] Sending to ${maskedTo}`);
    console.log(`   From: ${fromHeader}`);
    console.log(`   Subject: ${options.subject}`);
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      console.log(`   Text Preview:\n${options.text || options.html.slice(0, 150)}...\n`);
    }

    return { success: true, messageId: `console-${Date.now()}` };
  }
}
