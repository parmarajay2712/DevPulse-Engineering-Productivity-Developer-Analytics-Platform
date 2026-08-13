import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter: nodemailer.Transporter | null = null;

// Initialize mailer asynchronously to handle ethereal account creation if needed
export const initMailer = async () => {
  if (transporter) return transporter;

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('Production mailer initialized.');
    } else {
      // Create a test account using Ethereal for local development
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('Test mailer initialized (Ethereal). Messages will be available via URL logs.');
    }
    return transporter;
  } catch (error) {
    console.error('Failed to initialize mailer:', error);
    throw error;
  }
};

export const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
  const mailer = await initMailer();
  
  const info = await mailer.sendMail({
    from: '"DevPulse Alerts" <alerts@devpulse.com>', // sender address
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''), // plain text body
    html, // html body
  });

  console.log(`Message sent: ${info.messageId}`);
  if (info.messageId && (mailer.options as any).host === 'smtp.ethereal.email') {
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
};
