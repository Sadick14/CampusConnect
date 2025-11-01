/**
 * Email service for sending various types of emails in CampusConnect
 */

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send school invitation email to new admin
 */
export async function sendSchoolInvitationEmail(
  schoolName: string,
  adminEmail: string,
  password: string,
  loginUrl: string = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/login`
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'school-invitation',
        schoolName,
        adminEmail,
        password,
        loginUrl,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send school invitation email:', error);
    return {
      success: false,
      error: 'Failed to send invitation email'
    };
  }
}

/**
 * Send notification to parent emails
 */
export async function sendParentNotification(
  recipients: string[],
  schoolName: string,
  subject: string,
  message: string,
  schoolContact?: string
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'parent-notification',
        recipients,
        schoolName,
        subject,
        message,
        schoolContact,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send parent notification:', error);
    return {
      success: false,
      error: 'Failed to send parent notification'
    };
  }
}

/**
 * Send system notification to school admins
 */
export async function sendAdminNotification(
  adminEmails: string[],
  message: string,
  senderName: string
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'admin-notification',
        adminEmails,
        notificationMessage: message,
        senderName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return {
      success: false,
      error: 'Failed to send admin notification'
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'password-reset',
        email,
        name,
        resetUrl,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      error: 'Failed to send password reset email'
    };
  }
}