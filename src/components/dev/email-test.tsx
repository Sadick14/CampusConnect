'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2 } from 'lucide-react';

export default function EmailTestComponent() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const sendTestEmail = async () => {
    if (!formData.to || !formData.subject || !formData.message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields to send a test email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'parent-notification',
          recipients: [formData.to],
          schoolName: 'Test School',
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Test Email Sent!",
          description: `Email sent successfully to ${formData.to}`,
        });
        setFormData({ to: '', subject: '', message: '' });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Test email failed:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send test email. Check your email configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">To Email:</label>
          <Input
            type="email"
            placeholder="test@example.com"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Subject:</label>
          <Input
            placeholder="Test Email Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Message:</label>
          <Textarea
            placeholder="This is a test email message..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
          />
        </div>
        
        <Button onClick={sendTestEmail} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Test Email
        </Button>
      </CardContent>
    </Card>
  );
}