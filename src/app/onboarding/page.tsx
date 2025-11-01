'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { getInvitationByToken, acceptInvitation } from '@/services/invitation';
import { registerSchool } from '@/services/school';
import { createAcademicYear } from '@/services/academic-year';
import { initializeTrialSubscription } from '@/services/subscription';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

const STEPS = [
  { id: 1, title: 'School Information', icon: Building2 },
  { id: 2, title: 'Academic Year', icon: Calendar },
  { id: 3, title: 'Term Configuration', icon: Clock },
  { id: 4, title: 'Complete Setup', icon: CheckCircle2 },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);

  // Form state
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolWebsite, setSchoolWebsite] = useState('');
  const [schoolMotto, setSchoolMotto] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [academicYearName, setAcademicYearName] = useState('2024/2025');
  const [academicYearStart, setAcademicYearStart] = useState('2024-09-01');
  const [academicYearEnd, setAcademicYearEnd] = useState('2025-07-31');

  const [term1Start, setTerm1Start] = useState('2024-09-01');
  const [term1End, setTerm1End] = useState('2024-12-20');
  const [term2Start, setTerm2Start] = useState('2025-01-06');
  const [term2End, setTerm2End] = useState('2025-04-10');
  const [term3Start, setTerm3Start] = useState('2025-04-21');
  const [term3End, setTerm3End] = useState('2025-07-31');

  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load invitation
  useEffect(() => {
    async function loadInvitation() {
      const token = searchParams.get('token');
      
      if (!token) {
        toast({
          title: 'Invalid Link',
          description: 'No invitation token provided',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      setInviteToken(token);

      try {
        const invite = await getInvitationByToken(token);
        
        if (!invite) {
          toast({
            title: 'Invalid Invitation',
            description: 'This invitation link is invalid or has expired',
            variant: 'destructive',
          });
          router.push('/login');
          return;
        }

        setInvitation(invite);
        setSchoolName(invite.schoolName);
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load invitation',
          variant: 'destructive',
        });
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [searchParams, router, toast]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Logo must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!schoolName || schoolName.trim().length < 3) {
          toast({
            title: 'Invalid School Name',
            description: 'School name must be at least 3 characters',
            variant: 'destructive',
          });
          return false;
        }
        return true;

      case 2:
        if (!academicYearName || !academicYearStart || !academicYearEnd) {
          toast({
            title: 'Missing Information',
            description: 'Please fill all academic year fields',
            variant: 'destructive',
          });
          return false;
        }
        if (new Date(academicYearStart) >= new Date(academicYearEnd)) {
          toast({
            title: 'Invalid Dates',
            description: 'End date must be after start date',
            variant: 'destructive',
          });
          return false;
        }
        return true;

      case 3:
        if (!term1Start || !term1End || !term2Start || !term2End || !term3Start || !term3End) {
          toast({
            title: 'Missing Information',
            description: 'Please fill all term dates',
            variant: 'destructive',
          });
          return false;
        }
        return true;

      case 4:
        if (!adminPassword || adminPassword.length < 8) {
          toast({
            title: 'Weak Password',
            description: 'Password must be at least 8 characters',
            variant: 'destructive',
          });
          return false;
        }
        if (adminPassword !== confirmPassword) {
          toast({
            title: 'Passwords Mismatch',
            description: 'Passwords do not match',
            variant: 'destructive',
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!validateStep(4) || !invitation || !inviteToken) return;

    setSubmitting(true);

    try {
      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.adminEmail,
        adminPassword
      );
      const adminUid = userCredential.user.uid;

      // Step 2: Register school
      const school = await registerSchool({
        name: schoolName,
        adminEmail: invitation.adminEmail,
        adminPassword, // Will be ignored since we already created auth user
      });

      // Step 3: Accept invitation
      await acceptInvitation(inviteToken, school.id);

      // Step 4: Create academic year with terms
      const terms = [
        {
          termNumber: 1,
          name: 'First Term',
          startDate: Timestamp.fromDate(new Date(term1Start)),
          endDate: Timestamp.fromDate(new Date(term1End)),
          isCurrent: true,
        },
        {
          termNumber: 2,
          name: 'Second Term',
          startDate: Timestamp.fromDate(new Date(term2Start)),
          endDate: Timestamp.fromDate(new Date(term2End)),
          isCurrent: false,
        },
        {
          termNumber: 3,
          name: 'Third Term',
          startDate: Timestamp.fromDate(new Date(term3Start)),
          endDate: Timestamp.fromDate(new Date(term3End)),
          isCurrent: false,
        },
      ];

      await createAcademicYear({
        schoolId: school.id,
        name: academicYearName,
        startDate: Timestamp.fromDate(new Date(academicYearStart)),
        endDate: Timestamp.fromDate(new Date(academicYearEnd)),
        isCurrent: true,
        isActive: true,
        terms,
      });

      // Step 5: Initialize trial subscription
      await initializeTrialSubscription(school.id, school.name);

      toast({
        title: 'Setup Complete!',
        description: 'Your school has been successfully registered',
      });

      // Redirect to login
      setTimeout(() => {
        router.push('/login?onboarded=true');
      }, 2000);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to complete onboarding',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Syntra
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Let's set up your school in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    isActive ? 'text-primary' : isComplete ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isActive
                        ? 'bg-primary text-white'
                        : isComplete
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <span className="text-xs font-medium text-center hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Tell us about your school'}
              {currentStep === 2 && 'Configure your academic calendar'}
              {currentStep === 3 && 'Set up your term periods'}
              {currentStep === 4 && 'Create your admin account password'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: School Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g., Springfield High School"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">School Address</Label>
                  <Textarea
                    id="address"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    placeholder="Enter full school address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      value={schoolWebsite}
                      onChange={(e) => setSchoolWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motto">School Motto (Optional)</Label>
                  <Input
                    id="motto"
                    value={schoolMotto}
                    onChange={(e) => setSchoolMotto(e.target.value)}
                    placeholder="e.g., Excellence in Education"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">School Logo (Optional)</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum file size: 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Academic Year */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yearName">Academic Year Name *</Label>
                  <Input
                    id="yearName"
                    value={academicYearName}
                    onChange={(e) => setAcademicYearName(e.target.value)}
                    placeholder="e.g., 2024/2025"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearStart">Start Date *</Label>
                    <Input
                      id="yearStart"
                      type="date"
                      value={academicYearStart}
                      onChange={(e) => setAcademicYearStart(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearEnd">End Date *</Label>
                    <Input
                      id="yearEnd"
                      type="date"
                      value={academicYearEnd}
                      onChange={(e) => setAcademicYearEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Tip:</strong> The academic year typically spans from September to July.
                    You can modify this later if needed.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Term Configuration */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* First Term */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    First Term
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={term1Start}
                        onChange={(e) => setTerm1Start(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Input
                        type="date"
                        value={term1End}
                        onChange={(e) => setTerm1End(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Second Term */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Second Term
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={term2Start}
                        onChange={(e) => setTerm2Start(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Input
                        type="date"
                        value={term2End}
                        onChange={(e) => setTerm2End(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Third Term */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Third Term
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={term3Start}
                        onChange={(e) => setTerm3Start(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Input
                        type="date"
                        value={term3End}
                        onChange={(e) => setTerm3End(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Admin Password */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Almost there!</strong> Create a secure password for your admin account: <strong>{invitation?.adminEmail}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Setup Summary:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• School: {schoolName}</li>
                    <li>• Academic Year: {academicYearName}</li>
                    <li>• Terms: 3 configured</li>
                    <li>• Subscription: 30-day free trial</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} disabled={submitting}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          Need help? Contact support at support@syntra.app
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
