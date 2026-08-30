import { EmailService } from "../src/services/email/email.service";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Testing live email delivery to contact@rupakgupta.com...");
  const result = await EmailService.sendEmail({
    to: "contact@rupakgupta.com",
    subject: "ExamPattern AI Live OTP Test",
    text: "Your live test OTP code is: 889922",
    html: "<p>Your live test OTP code is: <b>889922</b></p>",
  });

  console.log("🎉 Result:", result);
}

main().catch(console.error);
