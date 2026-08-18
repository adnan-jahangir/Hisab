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
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let transporter: nodemailer.Transporter;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Create Ethereal test transporter for local development
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const priorityBadge = options.priority === 'high' ? '🔴 HIGH PRIORITY' : options.priority === 'medium' ? '🟡 MEDIUM PRIORITY' : '🟢 NOTICE';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
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
          <p style="margin: 4px 0 0;">Do not reply directly to this automated email.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Amar Hisab System'}" <${smtpUser || 'no-reply@hisab.local'}>`,
      to: options.to,
      subject: options.subject || options.title,
      html: htmlContent,
    });

    console.log(`[Email Sent] MessageID: ${info.messageId} to ${options.to}`);
    if (!smtpUser) {
      console.log(`[Ethereal Preview URL]: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return false;
  }
}
