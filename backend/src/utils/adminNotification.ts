import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Environment config
dotenv.config();

const ADMIN_EMAIL = 'ozdorukberk@gmail.com';

interface NotificationData {
  type: 'data_collection' | 'email_sending';
  status: 'started' | 'completed';
  details: {
    totalCities?: number;
    successful?: number;
    failed?: number;
    totalUsers?: number;
    emailsSent?: number;
    emailsFailed?: number;
    errors?: string[];
    duration?: string;
  };
}

export class AdminNotification {
  private mailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.mailTransporter = null;
  }

  // Mail transporter'ı lazy load
  private getMailTransporter() {
    if (!this.mailTransporter) {
      this.mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'your-email@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
        }
      });
    }
    return this.mailTransporter;
  }

  // Admin'e bildirim gönder
  public async sendNotification(data: NotificationData) {
    try {
      const transporter = this.getMailTransporter();
      
      const subject = this.generateSubject(data);
      const html = this.generateHTML(data);
      const text = this.generateText(data);

      const mailOptions = {
        from: process.env.GMAIL_USER || 'regor.newsletter@gmail.com',
        to: ADMIN_EMAIL,
        subject: subject,
        html: html,
        text: text
      };

      const result = await transporter!.sendMail(mailOptions);
      console.log(`📧 Admin notification sent to ${ADMIN_EMAIL}`);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to send admin notification:', error.message);
      // Admin notification hatası ana işlemi etkilemesin
    }
  }

  // Email subject oluştur
  private generateSubject(data: NotificationData): string {
    const type = data.type === 'data_collection' ? 'Data Collection' : 'Email Sending';
    const status = data.status === 'started' ? 'Started' : 'Completed';
    return `🚀 Regor ${type} ${status}`;
  }

  // HTML email oluştur
  private generateHTML(data: NotificationData): string {
    const type = data.type === 'data_collection' ? 'Data Collection' : 'Email Sending';
    const status = data.status === 'started' ? 'Started' : 'Completed';
    const statusEmoji = data.status === 'started' ? '🚀' : '✅';

    let detailsHTML = '';
    
    if (data.status === 'started') {
      if (data.type === 'data_collection') {
        detailsHTML = `
          <p><strong>Total Cities:</strong> ${data.details.totalCities || 0}</p>
        `;
      } else {
        detailsHTML = `
          <p><strong>Total Users:</strong> ${data.details.totalUsers || 0}</p>
        `;
      }
    } else {
      if (data.type === 'data_collection') {
        detailsHTML = `
          <p><strong>Successful:</strong> ${data.details.successful || 0}</p>
          <p><strong>Failed:</strong> ${data.details.failed || 0}</p>
          <p><strong>Duration:</strong> ${data.details.duration || 'Unknown'}</p>
        `;
      } else {
        detailsHTML = `
          <p><strong>Emails Sent:</strong> ${data.details.emailsSent || 0}</p>
          <p><strong>Emails Failed:</strong> ${data.details.emailsFailed || 0}</p>
          <p><strong>Duration:</strong> ${data.details.duration || 'Unknown'}</p>
        `;
      }
    }

    if (data.details.errors && data.details.errors.length > 0) {
      detailsHTML += `
        <h3>Errors:</h3>
        <ul>
          ${data.details.errors.slice(0, 5).map(error => `<li>${error}</li>`).join('')}
        </ul>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${statusEmoji} Regor ${type} ${status}</h2>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { 
          timeZone: 'Europe/Istanbul' 
        })}</p>
        ${detailsHTML}
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Regor Newsletter System.
        </p>
      </div>
    `;
  }

  // Text email oluştur
  private generateText(data: NotificationData): string {
    const type = data.type === 'data_collection' ? 'Data Collection' : 'Email Sending';
    const status = data.status === 'started' ? 'Started' : 'Completed';
    
    let details = '';
    
    if (data.status === 'started') {
      if (data.type === 'data_collection') {
        details = `Total Cities: ${data.details.totalCities || 0}`;
      } else {
        details = `Total Users: ${data.details.totalUsers || 0}`;
      }
    } else {
      if (data.type === 'data_collection') {
        details = `
Successful: ${data.details.successful || 0}
Failed: ${data.details.failed || 0}
Duration: ${data.details.duration || 'Unknown'}`;
      } else {
        details = `
Emails Sent: ${data.details.emailsSent || 0}
Emails Failed: ${data.details.emailsFailed || 0}
Duration: ${data.details.duration || 'Unknown'}`;
      }
    }

    return `
Regor ${type} ${status}

Time: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' })}

${details}

${data.details.errors && data.details.errors.length > 0 ? `
Errors:
${data.details.errors.slice(0, 3).map(error => `- ${error}`).join('\n')}
` : ''}

---
This is an automated notification from Regor Newsletter System.
    `;
  }
}

// Export singleton instance
export const adminNotification = new AdminNotification(); 