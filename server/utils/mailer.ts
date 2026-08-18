import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export async function sendNotificationEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.log(`[Notification Email Logged] To: ${options.to} | Subject: ${options.subject}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: smtpUser, pass: smtpPass },
    });

    const priorityBadge = options.priority === 'high' ? '🔴 HIGH PRIORITY' : options.priority === 'medium' ? '🟡 MEDIUM PRIORITY' : '🟢 NOTICE';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #4f46e5; padding: 16px; border-radius: 8px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px;">Amar Hisab (আমার হিসাব)</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Business Notification Alert</p>
        </div>
        
        <div style="padding: 20px 0;">
          <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; background-color: #f1f5f9; color: #334155; border-radius: 9999px; margin-bottom: 12px;">
            ${priorityBadge}
          </span>
          
          <h2 style="color: #0f172a; margin-top: 0;">${options.title}</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">${options.message}</p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">This email was sent automatically by Amar Hisab Notification System.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Amar Hisab System'}" <${smtpUser}>`,
      to: options.to,
      subject: options.subject || options.title,
      html: htmlContent,
    });

    console.log(`[Email Sent Successfully] to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return false;
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.log(`[OTP Generated & Logged] Code: ${otp} for ${to}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: smtpUser, pass: smtpPass },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #4f46e5; padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Amar Hisab (আমার হিসাব)</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Password Reset Verification OTP</p>
        </div>
        
        <div style="padding: 24px 0; text-align: center;">
          <p style="color: #334155; font-size: 15px; margin-bottom: 20px;">
            পাসওয়ার্ড রিস্টোর করার জন্য আপনার ৬ ডিকিটের নিরাপত্তা OTP কোড নিচে দেওয়া হলো:
          </p>
          
          <div style="display: inline-block; padding: 16px 32px; background-color: #f1f5f9; border: 2px dashed #4f46e5; border-radius: 12px; margin: 10px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4f46e5;">
              ${otp}
            </span>
          </div>
          
          <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
            ⚠️ এই OTP কোডটি আগামী <strong>১৫ মিনিট</strong> পর্যন্ত কার্যকর থাকবে। কারো সাথে কোডটি শেয়ার করবেন না।
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Amar Hisab System. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Amar Hisab System'}" <${smtpUser}>`,
      to,
      subject: `[Amar Hisab] ${otp} is your Password Reset Verification Code`,
      html: htmlContent,
    });

    console.log(`[OTP Email Dispatched Successfully] Code ${otp} to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}
