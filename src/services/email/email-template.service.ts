import { EmailTemplateData } from "./email.types";

export class EmailTemplateService {
  /**
   * Generates localized email content for Registration Email Verification OTP
   */
  public static getRegistrationOtpEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const isHindi = data.locale === "hi";

    if (isHindi) {
      const subject = `[${data.appName}] ईमेल सत्यापन कोड: ${data.otp}`;
      const text = `नमस्ते ${data.recipientName || "अभ्यर्थी"},\n\nExamPattern AI पर आपका स्वागत है!\n\nआपका 6-अंकीय सत्यापन कोड (OTP) है: ${data.otp}\n\nयह कोड ${data.expiresInMinutes} मिनट के लिए वैध है।\nकृपया सुरक्षा कारणों से इस कोड को किसी के साथ साझा न करें।\n\nसादर,\n${data.appName} टीम`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1d4ed8; margin: 0; font-size: 24px;">${data.appName}</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">आधिकारिक परीक्षा पैटर्न एवं मॉक टेस्ट प्लेटफॉर्म</p>
          </div>
          <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">नमस्ते <strong>${data.recipientName || "अभ्यर्थी"}</strong>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              ExamPattern AI पर आपका खाता पंजीकृत करने के लिए धन्यवाद। कृपया अपना ईमेल सत्यापित करने के लिए नीचे दिए गए वन-टाइम पासवर्ड (OTP) का उपयोग करें:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; padding: 12px 28px; background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; font-family: monospace;">
                ${data.otp}
              </span>
            </div>
            <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
              ⏱️ यह कोड <strong>${data.expiresInMinutes} मिनट</strong> के लिए वैध है।
            </p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
            <p style="margin: 0;">सुरक्षा चेतावनी: इस सत्यापन कोड को किसी के साथ साझा न करें। यदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    const subject = `[${data.appName}] Email Verification Code: ${data.otp}`;
    const text = `Hello ${data.recipientName || "Candidate"},\n\nWelcome to ExamPattern AI!\n\nYour 6-digit email verification code (OTP) is: ${data.otp}\n\nThis code is valid for ${data.expiresInMinutes} minutes.\nFor security reasons, please do not share this code with anyone.\n\nBest regards,\n${data.appName} Team`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1d4ed8; margin: 0; font-size: 24px;">${data.appName}</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Official Exam Pattern & Mock Platform</p>
        </div>
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hello <strong>${data.recipientName || "Candidate"}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Thank you for registering your account on ExamPattern AI. Please use the One-Time Password (OTP) below to verify your email address:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; padding: 12px 28px; background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; font-family: monospace;">
              ${data.otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
            ⏱️ This verification code is valid for <strong>${data.expiresInMinutes} minutes</strong>.
          </p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
          <p style="margin: 0;">Security Notice: Never share this OTP with anyone. If you did not request this registration, please ignore this email.</p>
        </div>
      </div>
    `;
    return { subject, html, text };
  }

  /**
   * Generates localized email content for Forgot Password OTP
   */
  public static getPasswordResetOtpEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const isHindi = data.locale === "hi";

    if (isHindi) {
      const subject = `[${data.appName}] पासवर्ड रीसेट सत्यापन कोड: ${data.otp}`;
      const text = `नमस्ते,\n\nहमने आपके ExamPattern AI खाते के लिए पासवर्ड रीसेट का अनुरोध प्राप्त किया है।\n\nआपका 6-अंकीय पासवर्ड रीसेट कोड (OTP) है: ${data.otp}\n\nयह कोड ${data.expiresInMinutes} मिनट के लिए वैध है।\nयदि आपने यह अनुरोध नहीं किया है, तो आपका खाता सुरक्षित है और आप इस ईमेल को अनदेखा कर सकते हैं।\n\nसादर,\n${data.appName} टीम`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1d4ed8; margin: 0; font-size: 24px;">${data.appName}</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">सुरक्षित पासवर्ड रीसेट सेवा</p>
          </div>
          <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">नमस्ते,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              हमने आपके खाते के लिए पासवर्ड रीसेट अनुरोध प्राप्त किया है। नया पासवर्ड सेट करने के लिए नीचे दिए गए कोड (OTP) का उपयोग करें:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #dc2626; padding: 12px 28px; background-color: #fef2f2; border: 2px dashed #fca5a5; border-radius: 12px; font-family: monospace;">
                ${data.otp}
              </span>
            </div>
            <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
              ⏱️ यह कोड <strong>${data.expiresInMinutes} मिनट</strong> के लिए वैध है।
            </p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
            <p style="margin: 0;">सुरक्षा चेतावनी: यदि आपने पासवर्ड रीसेट का अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें। आपका मौजूदा पासवर्ड सुरक्षित है।</p>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    const subject = `[${data.appName}] Password Reset Code: ${data.otp}`;
    const text = `Hello,\n\nWe received a request to reset your password for ExamPattern AI.\n\nYour 6-digit password reset code (OTP) is: ${data.otp}\n\nThis code is valid for ${data.expiresInMinutes} minutes.\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\n${data.appName} Team`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1d4ed8; margin: 0; font-size: 24px;">${data.appName}</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Secure Password Reset Service</p>
        </div>
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hello,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            We received a request to reset the password for your account. Please use the One-Time Password (OTP) below to proceed:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #dc2626; padding: 12px 28px; background-color: #fef2f2; border: 2px dashed #fca5a5; border-radius: 12px; font-family: monospace;">
              ${data.otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
            ⏱️ This reset code is valid for <strong>${data.expiresInMinutes} minutes</strong>.
          </p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
          <p style="margin: 0;">Security Notice: If you did not request a password reset, please ignore this email. Your existing password remains secure.</p>
        </div>
      </div>
    `;
    return { subject, html, text };
  }
}
