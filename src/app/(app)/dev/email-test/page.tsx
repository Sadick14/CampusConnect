'use client';

import { PageHeader } from '@/components/common/page-header';
import EmailTestComponent from '@/components/dev/email-test';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Mail, Settings } from 'lucide-react';

export default function EmailTestPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Email Testing"
        description="Test and configure email functionality for CampusConnect"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Setup instructions for email functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                To enable email functionality, you need to configure Resend:
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Sign up at <a href="https://resend.com" target="_blank" className="text-blue-600 underline">resend.com</a></li>
                  <li>Get your API key from the dashboard</li>
                  <li>Add it to your .env.local file as RESEND_API_KEY</li>
                  <li>Set RESEND_FROM_EMAIL to your verified sender domain</li>
                </ol>
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Environment Variables:</h4>
              <code className="text-sm block space-y-1">
                <div>RESEND_API_KEY=re_your_api_key_here</div>
                <div>RESEND_FROM_EMAIL=noreply@yourdomain.com</div>
              </code>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Features Enabled:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>✉️ School admin invitation emails</li>
                <li>👨‍👩‍👧‍👦 Parent communication emails</li>
                <li>🔔 Super admin notifications</li>
                <li>🔐 Password reset emails (coming soon)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Test Email Component */}
        <div>
          <EmailTestComponent />
          
          <Alert className="mt-4">
            <Mail className="h-4 w-4" />
            <AlertTitle>Development Mode</AlertTitle>
            <AlertDescription>
              This test component is only available in development. Use it to verify your email configuration is working correctly.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}