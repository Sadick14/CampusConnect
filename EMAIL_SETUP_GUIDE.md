# Email Communication Setup Guide

CampusConnect now includes comprehensive email functionality for communication between schools, admins, parents, and the system.

## 📧 Features Implemented

### 1. **School Registration Emails**
- ✅ Automatic welcome emails sent to new school admins
- ✅ Includes login credentials and setup instructions
- ✅ Professional HTML templates with branding

### 2. **Parent Communication**
- ✅ Bulk email notifications to all parents in a school
- ✅ Rich HTML formatting for announcements
- ✅ Integrated with student parent contact information

### 3. **Super Admin Notifications**
- ✅ System-wide notifications to all school admins
- ✅ Important alerts and updates from super admin
- ✅ Professional notification templates

### 4. **Future Features**
- 🔄 Password reset emails
- 🔄 SMS notifications (via Twilio integration)
- 🔄 Email delivery tracking
- 🔄 Email templates customization

## 🚀 Quick Setup

### Step 1: Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day limit)
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `re_`)

### Step 2: Configure Environment Variables
Add these to your `.env.local` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=CampusConnect <noreply@yourdomain.com>
```

### Step 3: Domain Verification (Production)
For production use, you'll need to:
1. Add your domain in Resend dashboard
2. Set up DNS records (SPF, DKIM)
3. Verify domain ownership

### Step 4: Test Email Functionality
1. Navigate to `/dev/email-test` in your app
2. Send a test email to verify configuration
3. Check console logs for any errors

## 📁 File Structure

```
src/
├── lib/
│   └── email.ts              # Core email service & templates
├── services/
│   └── email.ts              # Email service functions
├── app/
│   ├── api/
│   │   └── send-email/
│   │       └── route.ts      # Email API endpoint
│   └── (app)/
│       └── dev/
│           └── email-test/
│               └── page.tsx  # Email testing page
└── components/
    └── dev/
        └── email-test.tsx    # Email test component
```

## 🔧 Usage Examples

### Send School Invitation Email
```typescript
import { sendSchoolInvitationEmail } from '@/services/email';

const result = await sendSchoolInvitationEmail(
  'Green Valley High School',
  'admin@greenvalley.edu',
  'temporaryPassword123'
);
```

### Send Parent Notification
```typescript
import { sendParentNotification } from '@/services/email';

const result = await sendParentNotification(
  ['parent1@email.com', 'parent2@email.com'],
  'Green Valley High School',
  'Important School Update',
  'Dear parents, we have an important announcement...'
);
```

### Send Admin Notification
```typescript
import { sendAdminNotification } from '@/services/email';

const result = await sendAdminNotification(
  ['admin1@school1.com', 'admin2@school2.com'],
  'System maintenance scheduled for tomorrow at 2 PM',
  'Super Admin'
);
```

## 🎨 Email Templates

All emails use professional HTML templates with:
- **Responsive design** for mobile and desktop
- **School branding** with colors and logos
- **Clear call-to-action buttons**
- **Fallback text versions**

### Template Types:
1. **School Invitation** - Welcome new school admins
2. **Parent Notification** - School announcements to parents
3. **Admin Notification** - System alerts to school admins
4. **Password Reset** - Secure password reset links

## 🚨 Important Security Notes

### Development vs Production
- **Development**: Uses basic authentication
- **Production**: Requires domain verification and SPF/DKIM setup

### Rate Limits
- **Free Resend**: 100 emails/day, 10 emails/second
- **Paid Plans**: Higher limits available

### Email Validation
- All email addresses are validated before sending
- Invalid emails are filtered out automatically
- Delivery failures are logged for debugging

## 🧪 Testing

### Test Email Configuration
1. Visit `/dev/email-test` in your application
2. Enter a test email address
3. Send a test email to verify setup
4. Check both inbox and spam folders

### Debug Email Issues
1. Check browser console for API errors
2. Verify API key in environment variables
3. Check Resend dashboard for delivery logs
4. Ensure sender domain is verified (production)

## 🔄 Integration Status

### ✅ Completed Integrations
- [x] School registration process
- [x] Parent communication component
- [x] Super admin notifications
- [x] Email API endpoints
- [x] HTML email templates

### 🔄 Pending Integrations
- [ ] Password reset flow
- [ ] Email preferences for users
- [ ] Email delivery tracking
- [ ] SMS integration via Twilio
- [ ] Bulk email scheduling

## 🆘 Troubleshooting

### Common Issues

**1. "Failed to send email" error**
- Check if RESEND_API_KEY is set correctly
- Verify API key is valid in Resend dashboard
- Check network connectivity

**2. Emails not received**
- Check spam/junk folders
- Verify sender domain is configured
- Check Resend delivery logs

**3. API rate limit exceeded**
- Upgrade Resend plan for higher limits
- Implement email queuing for bulk sends
- Add delays between batch sends

**4. Invalid email addresses**
- Validate email formats before sending
- Clean up parent contact information
- Check for typos in email addresses

## 📞 Support

For email-related issues:
1. Check the `/dev/email-test` page first
2. Review Resend dashboard logs
3. Check application console for detailed errors
4. Verify environment variables are set correctly

---

**Next Steps**: Set up your Resend API key and start sending professional emails from CampusConnect! 📧