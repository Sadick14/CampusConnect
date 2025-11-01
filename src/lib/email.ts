import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender information
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'CampusConnect <noreply@campusconnect.com>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * Send bulk emails (with rate limiting considerations)
 */
export async function sendBulkEmails(emails: EmailOptions[]) {
  const results = [];
  
  // Send emails in batches to respect rate limits
  const batchSize = 10;
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchPromises = batch.map(email => sendEmail(email));
    
    try {
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error);
      results.push({ status: 'rejected', reason: error });
    }
  }
  
  return results;
}

/**
 * Email templates
 */
export const emailTemplates = {
  // School invitation email
  schoolInvitation: (schoolName: string, adminEmail: string, password: string, loginUrl: string) => ({
    subject: `Welcome to CampusConnect - Your ${schoolName} Admin Account`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to CampusConnect!</h2>
        <p>Congratulations! Your school <strong>${schoolName}</strong> has been successfully registered on CampusConnect.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Admin Account Details:</h3>
          <p><strong>School:</strong> ${schoolName}</p>
          <p><strong>Admin Email:</strong> ${adminEmail}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Click the link below to log in to your CampusConnect dashboard</li>
          <li>Change your password after first login</li>
          <li>Set up your school profile and upload your logo</li>
          <li>Start adding students, staff, and classes</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          If you have any questions, please don't hesitate to contact our support team.
        </p>
        
        <hr style="border: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px;">
          This email was sent by CampusConnect. Please do not reply to this automated message.
        </p>
      </div>
    `,
    text: `Welcome to CampusConnect!

Your school ${schoolName} has been successfully registered.

Admin Account Details:
- School: ${schoolName}
- Admin Email: ${adminEmail}
- Temporary Password: ${password}

Please visit ${loginUrl} to access your dashboard and change your password.

If you have any questions, please contact our support team.`
  }),

  // Parent communication template
  parentNotification: (schoolName: string, subject: string, message: string, schoolContact?: string) => ({
    subject: `${schoolName}: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">${schoolName}</h2>
        </div>
        
        <div style="padding: 30px 20px;">
          <h3 style="color: #1e40af; margin-bottom: 20px;">${subject}</h3>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
            ${message.split('\n').map(line => `<p style="margin: 10px 0;">${line}</p>`).join('')}
          </div>
          
          ${schoolContact ? `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                For questions about this message, please contact: <strong>${schoolContact}</strong>
              </p>
            </div>
          ` : ''}
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
          This message was sent by ${schoolName} via CampusConnect.
        </div>
      </div>
    `,
    text: `${schoolName}: ${subject}

${message}

${schoolContact ? `For questions, contact: ${schoolContact}` : ''}

This message was sent by ${schoolName} via CampusConnect.`
  }),

  // Super admin notification template
  adminNotification: (message: string, senderName: string) => ({
    subject: 'CampusConnect: System Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">CampusConnect System Notification</h2>
        </div>
        
        <div style="padding: 30px 20px;">
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px;">
            <h3 style="color: #dc2626; margin-top: 0;">Important Message from Super Admin</h3>
            ${message.split('\n').map(line => `<p style="margin: 10px 0;">${line}</p>`).join('')}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Sent by: <strong>${senderName}</strong> (Super Admin)
            </p>
          </div>
        </div>
      </div>
    `,
    text: `CampusConnect System Notification

Important Message from Super Admin:

${message}

Sent by: ${senderName} (Super Admin)`
  }),

  // Password reset template
  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'CampusConnect: Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your CampusConnect password.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          This link will expire in 24 hours. If you didn't request this reset, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Hello ${name},

We received a request to reset your CampusConnect password.

Please click the following link to reset your password:
${resetUrl}

This link will expire in 24 hours. If you didn't request this reset, you can safely ignore this email.`
  })
};