// src/utils/emailService.ts
import nodemailer from 'nodemailer';
import { createTransport, Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, any>;
}

export class EmailService {
  private transporter!: Transporter;
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../../email-templates');
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // ใช้ environment variables สำหรับ configuration
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    this.transporter = createTransport(config);

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email service is ready to send messages');
      }
    });
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const { to, subject, html, text, template, context } = options;

      let finalHtml = html;
      let finalText = text;

      // หากใช้ template
      if (template && context) {
        const templateContent = await this.compileTemplate(template, context);
        finalHtml = templateContent.html;
        finalText = templateContent.text;
      }

      const mailOptions = {
        from: this.getFromAddress(),
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: finalHtml,
        text: finalText,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}: ${result.messageId}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error}`);
    }
  }

  private async compileTemplate(
    templateName: string, 
    context: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    try {
      const htmlTemplatePath = path.join(this.templatesDir, `${templateName}.html`);
      const textTemplatePath = path.join(this.templatesDir, `${templateName}.txt`);

      let htmlContent = '';
      let textContent = '';

      // Compile HTML template
      if (fs.existsSync(htmlTemplatePath)) {
        const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');
        const htmlCompiled = handlebars.compile(htmlTemplate);
        htmlContent = htmlCompiled(context);
      }

      // Compile text template
      if (fs.existsSync(textTemplatePath)) {
        const textTemplate = fs.readFileSync(textTemplatePath, 'utf8');
        const textCompiled = handlebars.compile(textTemplate);
        textContent = textCompiled(context);
      }

      return { html: htmlContent, text: textContent };
    } catch (error) {
      console.error('Template compilation failed:', error);
      throw new Error('Failed to compile email template');
    }
  }

  private getFromAddress(): string {
    return process.env.EMAIL_FROM || `"${process.env.APP_NAME || 'App'}" <no-reply@example.com>`;
  }

  // Specific email methods
  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'verify-email',
      context: {
        firstName,
        verificationLink,
        appName: process.env.APP_NAME || 'Our App',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        expiryHours: 24,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset Your Password',
      template: 'reset-password',
      context: {
        firstName,
        resetLink,
        appName: process.env.APP_NAME || 'Our App',
        expiryHours: 1, // Usually shorter expiry for password reset
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Welcome to Our App!',
      template: 'welcome',
      context: {
        firstName,
        appName: process.env.APP_NAME || 'Our App',
        loginLink: `${process.env.FRONTEND_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      },
    });
  }
}

// Singleton instance
export const emailService = new EmailService();