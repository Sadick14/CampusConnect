'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/common/page-header';
import { StudentRegistrationForm } from '@/components/students/student-registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BookOpen } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function StudentRegistrationPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // Only school admins, organization owners and superadmins can register students
  if (!loading && currentUser && !['school_admin', 'organization_owner', 'superadmin'].includes(currentUser.role)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only administrators can register new students.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const handleSuccess = (studentId: string) => {
    // Redirect to student profile after successful registration
    setTimeout(() => {
      router.push(`/students/${studentId}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register New Student"
        description="Complete the multi-step form to register a new student in your school"
      />

      <Alert className="bg-blue-50 border-blue-200">
        <BookOpen className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Student Registration</AlertTitle>
        <AlertDescription className="text-blue-800">
          This form will collect comprehensive information about the student including personal details, academic history, guardian information, and medical information. All fields marked with * are required.
        </AlertDescription>
      </Alert>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>New Student Registration Form</CardTitle>
          <CardDescription>
            Fill in all the required information. You can navigate between steps using the Previous and Next buttons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentRegistrationForm
            schoolId={currentUser?.schoolId || ''}
            userId={currentUser?.id || ''}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Information You'll Need</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Personal Information</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Student's full name and date of birth</li>
              <li>Contact email and phone number</li>
              <li>Gender</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Academic Details</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Current class/grade</li>
              <li>Unique admission number</li>
              <li>Admission date</li>
              <li>Previous school information (if applicable)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Contact & Guardian Information</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Residential address</li>
              <li>Primary guardian/parent details</li>
              <li>Secondary guardian details (optional)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Medical Information</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Blood group</li>
              <li>Known allergies</li>
              <li>Chronic conditions</li>
              <li>Medications required</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
