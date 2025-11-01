import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    let emailOptions;

    switch (type) {
      case 'school-invitation':
        const { schoolName, adminEmail, password, loginUrl } = data;
        const invitationTemplate = emailTemplates.schoolInvitation(schoolName, adminEmail, password, loginUrl);
        emailOptions = {
          to: adminEmail,
          ...invitationTemplate
        };
        break;

      case 'parent-notification':
        const { recipients, schoolName, subject, message, schoolContact } = data;
        const parentTemplate = emailTemplates.parentNotification(schoolName, subject, message, schoolContact);
        emailOptions = {
          to: recipients,
          ...parentTemplate
        };
        break;

      case 'admin-notification':
        const { adminEmails, notificationMessage, senderName } = data;
        const adminTemplate = emailTemplates.adminNotification(notificationMessage, senderName);
        emailOptions = {
          to: adminEmails,
          ...adminTemplate
        };
        break;

      case 'password-reset':
        const { email, name, resetUrl } = data;
        const resetTemplate = emailTemplates.passwordReset(name, resetUrl);
        emailOptions = {
          to: email,
          ...resetTemplate
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    const result = await sendEmail(emailOptions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: result.data
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}